import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import type { AppKey, AppsDefinition } from '@/apps';
import { TransportContext } from './transport-context';
import type {
  AssignInput,
  AssignOptions,
  AssignResponse,
  SessionBoundaries,
  Task,
  TransportConfig,
  TransportContextValue,
} from './types';

const DEFAULT_RECONNECT_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
} as const;

const DEFAULT_PING_INTERVAL = 30000;

interface TransportProviderProps {
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
  channel: 'state' | 'locks' | 'tasks',
) {
  const url = new URL(wsBaseUrl);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${channel}`;
  return url.toString();
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
            stateWsUrl: createChannelWsUrl(wsUrl, 'state'),
            lockWsUrl: createChannelWsUrl(wsUrl, 'locks'),
            taskWsUrl: createChannelWsUrl(wsUrl, 'tasks'),
          },
        ];
      }),
    ) as Record<
      AppKey,
      {
        apiEndpoint: string;
        wsUrl: string;
        stateWsUrl: string;
        lockWsUrl: string;
        taskWsUrl: string;
      }
    >;
  }, [appKeys, config.apiEndpoint, config.appEndpoints, config.wsEndpoint]);

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

      return {
        sessionStart: new Date(data.start_time),
        sessionEnd: new Date(data.end_time),
        startRevision: data.start_revision,
        endRevision: data.end_revision,
        sessionId: data.session_id,
      };
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

      return {
        sessionStart: new Date(data.start_time),
        sessionEnd: new Date(data.end_time),
        startRevision: data.start_revision,
        endRevision: data.end_revision,
        sessionId: data.session_id,
      };
    },
    [getEndpoints],
  );

  const fetchLocks = useCallback(
    async (appKey: AppKey) => {
      const { apiEndpoint } = getEndpoints(appKey);
      const url = `${apiEndpoint.replace(/\/$/, '')}/locks`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch locks: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as {
        locks: Record<string, { task_id: string }>;
      };

      return data.locks;
    },
    [getEndpoints],
  );

  const contextValue = useMemo<TransportContextValue>(
    () => ({
      apiEndpoint: endpointsByApp[defaultAppKey].apiEndpoint,
      apps,
      defaultAppKey,
      app,
      wsUrl: endpointsByApp[defaultAppKey].wsUrl,
      instanceId: config.instanceId,
      pingInterval,
      reconnect,
      assignAction,
      fetchTask,
      fetchSessionBoundaries,
      fetchActiveSessionBoundaries,
      cancelTaskRequest: createTaskMutation('cancel'),
      pauseTaskRequest: createTaskMutation('pause'),
      unpauseTaskRequest: createTaskMutation('resume'),
      stepTaskRequest: createTaskMutation('step'),
      fetchState,
      fetchLocks,
      getApp,
      getEndpoints,
    }),
    [
      app,
      apps,
      assignAction,
      config.instanceId,
      createTaskMutation,
      defaultAppKey,
      endpointsByApp,
      fetchActiveSessionBoundaries,
      fetchLocks,
      fetchSessionBoundaries,
      fetchState,
      fetchTask,
      getApp,
      getEndpoints,
      pingInterval,
      reconnect,
    ],
  );

  return (
    <TransportContext.Provider value={contextValue}>
      {children}
    </TransportContext.Provider>
  );
}

export default TransportProvider;
