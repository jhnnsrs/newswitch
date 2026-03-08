import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AppKey, AppsDefinition } from '@/lib/rekuest/types';
import { TransportContext } from './transport-context';
import type {
  AssignInput,
  AssignOptions,
  AssignResponse,
  FromAgentMessage,
  RevisedStatesSnapshotMap,
  SessionBoundaries,
  Task,
  TransportConfig,
  TransportContextValue,
  TransportMessageSubscription,
  TransportSocketConnectionState,
  TransportSubscriptionTopic,
  TransportTopicMessageMap,
} from '@/lib/rekuest/transport/types';

const DEFAULT_RECONNECT_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
} as const;

const DEFAULT_PING_INTERVAL = 30000;

type AppEndpoints = {
  apiEndpoint: string;
  wsUrl: string;
  stateWsUrl: string;
  lockWsUrl: string;
  taskWsUrl: string;
};

type SocketState = TransportSocketConnectionState;

type ChannelState<TTopic extends TransportSubscriptionTopic> = {
  ws: WebSocket | null;
  listeners: Set<(message: TransportTopicMessageMap[TTopic]) => void>;
  connectionState: SocketState;
  reconnectTimeoutId: ReturnType<typeof setTimeout> | null;
  shouldReconnect: boolean;
};

export interface TransportProviderProps {
  children: ReactNode;
  config: TransportConfig;
  apps: AppsDefinition;
}

function normalizeTask<TArgs = unknown, TReturn = unknown>(
  data: Record<string, unknown>,
  appKey: AppKey,
): Task<TArgs, TReturn> {
  return {
    id: String(data.task_id ?? data.id),
    appKey,
    action: String(data.action ?? 'unknown'),
    args: (data.args ?? {}) as TArgs,
    status: data.status as Task<TArgs, TReturn>['status'],
    result: data.result as TReturn | undefined,
    error: data.error as string | undefined,
    progress: data.progress as number | undefined,
    reference: String(data.reference ?? data.task_id ?? data.id),
    createdAt: new Date(String(data.created_at ?? data.createdAt ?? Date.now())),
    updatedAt: new Date(String(data.updated_at ?? data.updatedAt ?? Date.now())),
  };
}

function createWsBaseUrl(apiEndpoint: string, wsEndpoint?: string) {
  if (wsEndpoint) {
    return wsEndpoint;
  }

  const url = new URL(apiEndpoint);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = url.pathname.replace(/\/$/, '') + '/ws';
  return url.toString();
}

function createChannelWsUrl(
  wsBaseUrl: string,
  channel: TransportSubscriptionTopic,
  queryParams?: Record<string, string[]>,
) {
  const url = new URL(wsBaseUrl);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${channel}`;

  Object.entries(queryParams ?? {}).forEach(([key, values]) => {
    if (values.length > 0) {
      url.searchParams.set(key, values.join(','));
    }
  });

  return url.toString();
}

function parseSessionBoundaries(data: {
  session_id: string;
  start_revision: number;
  end_revision: number;
  start_time: string;
  end_time: string;
}): SessionBoundaries {
  return {
    sessionStart: new Date(data.start_time),
    sessionEnd: new Date(data.end_time),
    startRevision: data.start_revision,
    endRevision: data.end_revision,
    sessionId: data.session_id,
  };
}

function createInitialConnectionState(): SocketState {
  return {
    isConnected: false,
    isReconnecting: false,
    isUnconnectable: false,
    reconnectAttempt: 0,
  };
}

export function TransportProvider({ children, config, apps }: TransportProviderProps) {
  const appKeys = useMemo(() => Object.keys(apps) as AppKey[], [apps]);
  const defaultAppKey = appKeys[0];
  const app = apps[defaultAppKey];

  if (!defaultAppKey || !app) {
    throw new Error('TransportProvider requires at least one configured app.');
  }

  const reconnect = useMemo(
    () => ({ ...DEFAULT_RECONNECT_CONFIG, ...config.reconnect }),
    [config.reconnect],
  );

  const pingInterval = config.pingInterval ?? DEFAULT_PING_INTERVAL;

  const endpointsByApp = useMemo(() => {
    return Object.fromEntries(
      appKeys.map((appKey) => {
        const apiEndpoint =
          config.appEndpoints?.[appKey]?.apiEndpoint ?? config.apiEndpoint;
        const wsUrl = createWsBaseUrl(
          apiEndpoint,
          config.appEndpoints?.[appKey]?.wsEndpoint ?? config.wsEndpoint,
        );

        return [
          appKey,
          {
            apiEndpoint,
            wsUrl,
            stateWsUrl: createChannelWsUrl(wsUrl, 'states', {
              stateKeys: Object.values(
                apps[appKey].states as Record<string, { key: string }>,
              ).map(
                (definition) => definition.key,
              ),
            }),
            lockWsUrl: createChannelWsUrl(wsUrl, 'locks', {
              lockKeys: Object.values(
                apps[appKey].locks as Record<string, { key: string }>,
              ).map(
                (definition) => definition.key,
              ),
            }),
            taskWsUrl: createChannelWsUrl(wsUrl, 'tasks', {
              actionKeys: Object.values(
                apps[appKey].actions as Record<string, { name: string }>,
              ).map(
                (definition) => definition.name,
              ),
            }),
          } satisfies AppEndpoints,
        ];
      }),
    ) as Record<AppKey, AppEndpoints>;
  }, [appKeys, apps, config.apiEndpoint, config.appEndpoints, config.wsEndpoint]);

  const getApp = useCallback(
    (appKey: AppKey) => {
      const resolvedApp = apps[appKey];

      if (!resolvedApp) {
        throw new Error(`Unknown app key: ${appKey}`);
      }

      return resolvedApp;
    },
    [apps],
  );

  const getEndpoints = useCallback(
    (appKey: AppKey) => {
      const endpoints = endpointsByApp[appKey];

      if (!endpoints) {
        throw new Error(`No endpoints configured for app key: ${appKey}`);
      }

      return endpoints;
    },
    [endpointsByApp],
  );

  const channelStatesRef = useRef(
    new Map<string, ChannelState<TransportSubscriptionTopic>>(),
  );
  const connectionListenersRef = useRef(
    new Map<AppKey, Set<(state: SocketState) => void>>(),
  );
  const pingIntervalsRef = useRef(new Map<string, ReturnType<typeof setInterval>>());

  const channelKeyFor = useCallback(
    (appKey: AppKey, topic: TransportSubscriptionTopic) => `${appKey}:${topic}`,
    [],
  );

  const notifyConnectionListeners = useCallback(
    (appKey: AppKey) => {
      const listeners = connectionListenersRef.current.get(appKey);

      if (!listeners || listeners.size === 0) {
        return;
      }

      const states = (['states', 'locks', 'tasks'] as const).map((topic) => {
        const key = channelKeyFor(appKey, topic);
        return (
          channelStatesRef.current.get(key)?.connectionState ??
          createInitialConnectionState()
        );
      });

      const aggregateState: SocketState = {
        isConnected: states.some((state) => state.isConnected),
        isReconnecting: states.some((state) => state.isReconnecting),
        isUnconnectable: states.some((state) => state.isUnconnectable),
        reconnectAttempt: states.reduce(
          (maxAttempt, state) => Math.max(maxAttempt, state.reconnectAttempt),
          0,
        ),
      };

      listeners.forEach((listener) => listener(aggregateState));
    },
    [channelKeyFor],
  );

  const stopPing = useCallback((key: string) => {
    const intervalId = pingIntervalsRef.current.get(key);

    if (!intervalId) {
      return;
    }

    clearInterval(intervalId);
    pingIntervalsRef.current.delete(key);
  }, []);

  const cleanupSocket = useCallback(
    (key: string) => {
      stopPing(key);
      const state = channelStatesRef.current.get(key);

      if (!state?.ws) {
        return;
      }

      state.ws.onopen = null;
      state.ws.onmessage = null;
      state.ws.onclose = null;
      state.ws.onerror = null;

      if (
        state.ws.readyState === WebSocket.OPEN ||
        state.ws.readyState === WebSocket.CONNECTING
      ) {
        state.ws.close(1000, 'Client cleanup');
      }

      state.ws = null;
    },
    [stopPing],
  );

  const scheduleReconnect = useCallback(
    (appKey: AppKey, topic: TransportSubscriptionTopic) => {
      const key = channelKeyFor(appKey, topic);
      const state = channelStatesRef.current.get(key);

      if (!state) {
        return;
      }

      const nextAttempt = state.connectionState.reconnectAttempt + 1;
      state.connectionState = {
        ...state.connectionState,
        isConnected: false,
        isReconnecting: nextAttempt <= reconnect.maxAttempts,
        reconnectAttempt: nextAttempt,
        isUnconnectable: nextAttempt > reconnect.maxAttempts,
      };
      notifyConnectionListeners(appKey);

      if (nextAttempt > reconnect.maxAttempts) {
        return;
      }

      const delay = Math.min(
        reconnect.initialDelay * Math.pow(reconnect.backoffMultiplier, nextAttempt - 1),
        reconnect.maxDelay,
      );

      state.reconnectTimeoutId = setTimeout(() => {
        state.reconnectTimeoutId = null;
        if (state.shouldReconnect) {
          connectChannel(appKey, topic);
        }
      }, delay);
    },
    [channelKeyFor, notifyConnectionListeners, reconnect],
  );

  const connectChannel = useCallback(
    (appKey: AppKey, topic: TransportSubscriptionTopic) => {
      const key = channelKeyFor(appKey, topic);
      const existingState = channelStatesRef.current.get(key) as
        | ChannelState<typeof topic>
        | undefined;
      const state =
        existingState ?? {
          ws: null,
          listeners: new Set(),
          connectionState: createInitialConnectionState(),
          reconnectTimeoutId: null,
          shouldReconnect: true,
        };
      channelStatesRef.current.set(
        key,
        state as ChannelState<TransportSubscriptionTopic>,
      );

      if (state.connectionState.isUnconnectable) {
        notifyConnectionListeners(appKey);
        return;
      }

      if (
        state.ws?.readyState === WebSocket.OPEN ||
        state.ws?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }

      const url = getEndpoints(appKey)[
        topic === 'states'
          ? 'stateWsUrl'
          : topic === 'locks'
            ? 'lockWsUrl'
            : 'taskWsUrl'
      ];

      cleanupSocket(key);

      const ws = new WebSocket(url);
      state.ws = ws;

      ws.onopen = () => {
        state.connectionState = {
          isConnected: true,
          isReconnecting: false,
          isUnconnectable: false,
          reconnectAttempt: 0,
        };
        notifyConnectionListeners(appKey);
        stopPing(key);
        pingIntervalsRef.current.set(
          key,
          setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, pingInterval),
        );
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as FromAgentMessage;
        state.listeners.forEach((listener) => {
          listener(message as TransportTopicMessageMap[typeof topic]);
        });
      };

      ws.onerror = () => {
        state.connectionState = {
          ...state.connectionState,
          isConnected: false,
        };
        notifyConnectionListeners(appKey);
      };

      ws.onclose = () => {
        stopPing(key);
        state.connectionState = {
          ...state.connectionState,
          isConnected: false,
        };
        notifyConnectionListeners(appKey);
        if (state.shouldReconnect) {
          scheduleReconnect(appKey, topic);
        }
      };
    },
    [
      channelKeyFor,
      cleanupSocket,
      getEndpoints,
      notifyConnectionListeners,
      pingInterval,
      scheduleReconnect,
      stopPing,
    ],
  );

  const subscribeToMessages = useCallback(
    <TTopic extends TransportSubscriptionTopic>(options: {
      appKey: AppKey;
      topic: TTopic;
      listener: (message: TransportTopicMessageMap[TTopic]) => void;
    }): TransportMessageSubscription => {
      const key = channelKeyFor(options.appKey, options.topic);
      const existingState = channelStatesRef.current.get(key) as
        | ChannelState<TTopic>
        | undefined;
      const state =
        existingState ?? {
          ws: null,
          listeners: new Set(),
          connectionState: createInitialConnectionState(),
          reconnectTimeoutId: null,
          shouldReconnect: true,
        };

      channelStatesRef.current.set(
        key,
        state as ChannelState<TransportSubscriptionTopic>,
      );
      state.listeners.add(options.listener);
      connectChannel(options.appKey, options.topic);

      return {
        unsubscribe: () => {
          state.listeners.delete(options.listener);
          if (state.listeners.size === 0) {
            state.shouldReconnect = false;
            if (state.reconnectTimeoutId) {
              clearTimeout(state.reconnectTimeoutId);
              state.reconnectTimeoutId = null;
            }
            cleanupSocket(key);
            state.connectionState = createInitialConnectionState();
            notifyConnectionListeners(options.appKey);
          }
        },
      };
    },
    [channelKeyFor, cleanupSocket, connectChannel, notifyConnectionListeners],
  );

  const subscribeToConnectionState = useCallback(
    (appKey: AppKey, listener: (state: SocketState) => void) => {
      const listeners = connectionListenersRef.current.get(appKey) ?? new Set();
      listeners.add(listener);
      connectionListenersRef.current.set(appKey, listeners);
      notifyConnectionListeners(appKey);

      return () => {
        const currentListeners = connectionListenersRef.current.get(appKey);
        if (!currentListeners) {
          return;
        }

        currentListeners.delete(listener);
        if (currentListeners.size === 0) {
          connectionListenersRef.current.delete(appKey);
        }
      };
    },
    [notifyConnectionListeners],
  );

  const reconnectSocket = useCallback(
    (appKey?: AppKey) => {
      const targetApps = appKey ? [appKey] : appKeys;

      targetApps.forEach((currentAppKey) => {
        (['states', 'locks', 'tasks'] as const).forEach((topic) => {
          const key = channelKeyFor(currentAppKey, topic);
          const state = channelStatesRef.current.get(key);

          if (!state) {
            return;
          }

          state.shouldReconnect = true;
          state.connectionState = createInitialConnectionState();
          if (state.reconnectTimeoutId) {
            clearTimeout(state.reconnectTimeoutId);
            state.reconnectTimeoutId = null;
          }
          cleanupSocket(key);
          connectChannel(currentAppKey, topic);
        });
        notifyConnectionListeners(currentAppKey);
      });
    },
    [appKeys, channelKeyFor, cleanupSocket, connectChannel, notifyConnectionListeners],
  );

  const disconnectSocket = useCallback(
    (appKey?: AppKey) => {
      const targetApps = appKey ? [appKey] : appKeys;

      targetApps.forEach((currentAppKey) => {
        (['states', 'locks', 'tasks'] as const).forEach((topic) => {
          const key = channelKeyFor(currentAppKey, topic);
          const state = channelStatesRef.current.get(key);

          if (!state) {
            return;
          }

          state.shouldReconnect = false;
          if (state.reconnectTimeoutId) {
            clearTimeout(state.reconnectTimeoutId);
            state.reconnectTimeoutId = null;
          }
          cleanupSocket(key);
          state.connectionState = createInitialConnectionState();
        });
        notifyConnectionListeners(currentAppKey);
      });
    },
    [appKeys, channelKeyFor, cleanupSocket, notifyConnectionListeners],
  );

  const assignAction = useCallback(
    async <TArgs,>(
      appKey: AppKey,
      actionName: string,
      args: TArgs,
      options?: AssignOptions,
    ): Promise<AssignResponse> => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = `${apiEndpoint.replace(/\/$/, '')}/${actionName}`;
      const assignInput: AssignInput<TArgs> = {
        args,
        instanceId: config.instanceId,
        action: actionName,
        policy: options?.policy,
        agent: options?.agent,
        reservation: options?.reservation,
        reference: options?.reference,
        parent: options?.parent,
        cached: options?.cached ?? false,
        log: options?.log ?? true,
        capture: options?.capture ?? false,
        ephemeral: options?.ephemeral ?? false,
        hooks: options?.hooks,
        step: options?.step,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignInput),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to assign action: ${response.status} ${errorText}`);
      }

      return (await response.json()) as AssignResponse;
    },
    [config.instanceId, getEndpoints],
  );

  const fetchTask = useCallback(
    async <TArgs = unknown, TReturn = unknown>(
      appKey: AppKey,
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = `${apiEndpoint.replace(/\/$/, '')}/tasks/${taskId}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get task: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      return normalizeTask<TArgs, TReturn>(data, appKey);
    },
    [getEndpoints],
  );

  const createTaskMutation = useCallback(
    (endpoint: string) => async (appKey: AppKey, taskId: string) => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = `${apiEndpoint.replace(/\/$/, '')}/${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ assignation: taskId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${endpoint} task: ${response.status} ${errorText}`);
      }
    },
    [getEndpoints],
  );

  const fetchState = useCallback(
    async <T = unknown,>(appKey: AppKey, stateName: string): Promise<T> => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = `${apiEndpoint.replace(/\/$/, '')}/states/${stateName}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch state: ${response.status} ${errorText}`);
      }

      return (await response.json()) as T;
    },
    [getEndpoints],
  );

  const fetchStateCheckout = useCallback(
    async (
      appKey: AppKey,
      globalRevisionId: string | number,
      stateKeys: string[],
    ): Promise<RevisedStatesSnapshotMap> => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = new URL(`${apiEndpoint.replace(/\/$/, '')}/states/checkout`);
      url.searchParams.set('global_revision_id', String(globalRevisionId));

      for (const stateKey of stateKeys) {
        url.searchParams.append('state_keys', stateKey);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to checkout states: ${response.status} ${errorText}`);
      }

      return (await response.json()) as RevisedStatesSnapshotMap;
    },
    [getEndpoints],
  );

  const fetchLocks = useCallback(
    async (appKey: AppKey): Promise<Record<string, { task_id: string }>> => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = `${apiEndpoint.replace(/\/$/, '')}/locks`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch locks: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as
        | Record<string, { task_id: string }>
        | Array<{ key: string; task_id: string }>;

      if (Array.isArray(data)) {
        return Object.fromEntries(
          data.map((entry) => [entry.key, { task_id: entry.task_id }]),
        );
      }

      return data;
    },
    [getEndpoints],
  );

  const fetchActiveSessionBoundaries = useCallback(
    async (appKey: AppKey): Promise<SessionBoundaries> => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = `${apiEndpoint.replace(/\/$/, '')}/active_session_boundaries`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch session boundaries: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        session_id: string;
        start_revision: number;
        end_revision: number;
        start_time: string;
        end_time: string;
      };

      return parseSessionBoundaries(data);
    },
    [getEndpoints],
  );

  const fetchSessionBoundaries = useCallback(
    async (appKey: AppKey, sessionId: string): Promise<SessionBoundaries> => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = `${apiEndpoint.replace(/\/$/, '')}/session_boundaries/${sessionId}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch session boundaries: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        session_id: string;
        start_revision: number;
        end_revision: number;
        start_time: string;
        end_time: string;
      };

      return parseSessionBoundaries(data);
    },
    [getEndpoints],
  );

  useEffect(() => {
    return () => {
      disconnectSocket();
      channelStatesRef.current.clear();
      connectionListenersRef.current.clear();
    };
  }, [disconnectSocket]);

  const contextValue = useMemo<TransportContextValue>(
    () => ({
      apiEndpoint: config.apiEndpoint,
      apps,
      app,
      wsUrl: endpointsByApp[defaultAppKey].wsUrl,
      defaultAppKey,
      instanceId: config.instanceId,
      pingInterval,
      reconnect,
      getApp,
      getEndpoints,
      assignAction,
      fetchTask,
      fetchState,
      fetchStateCheckout,
      fetchLocks,
      fetchSessionBoundaries,
      fetchActiveSessionBoundaries,
      cancelTaskRequest: createTaskMutation('cancel'),
      pauseTaskRequest: createTaskMutation('pause'),
      unpauseTaskRequest: createTaskMutation('unpause'),
      stepTaskRequest: createTaskMutation('step'),
      subscribeToMessages,
      subscribeToConnectionState,
      reconnectSocket,
      disconnectSocket,
    }),
    [
      app,
      apps,
      assignAction,
      config.apiEndpoint,
      config.instanceId,
      createTaskMutation,
      defaultAppKey,
      disconnectSocket,
      endpointsByApp,
      fetchActiveSessionBoundaries,
      fetchLocks,
      fetchSessionBoundaries,
      fetchState,
      fetchStateCheckout,
      fetchTask,
      getApp,
      getEndpoints,
      pingInterval,
      reconnect,
      reconnectSocket,
      subscribeToConnectionState,
      subscribeToMessages,
    ],
  );

  return <TransportContext.Provider value={contextValue}>{children}</TransportContext.Provider>;
}

export default TransportProvider;
