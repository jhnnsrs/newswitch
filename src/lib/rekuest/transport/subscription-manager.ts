import type { AppKey } from '@/lib/rekuest/types';
import type {
  FromAgentMessage,
  TransportConfig,
  TransportMessageSubscription,
  TransportSocketConnectionState,
  TransportSubscriptionTopic,
  TransportTopicMessageMap,
} from '@/lib/rekuest/transport/types';

export type TransportManagerEndpoints = {
  stateWsUrl: string;
  lockWsUrl: string;
  taskWsUrl: string;
};

type SocketState = TransportSocketConnectionState;
type ReconnectConfig = Required<NonNullable<TransportConfig['reconnect']>>;

type ChannelState<TTopic extends TransportSubscriptionTopic> = {
  ws: WebSocket | null;
  listeners: Set<(message: TransportTopicMessageMap[TTopic]) => void>;
  connectionState: SocketState;
  reconnectTimeoutId: ReturnType<typeof setTimeout> | null;
  shouldReconnect: boolean;
};

export interface TransportSubscriptionManagerOptions {
  getEndpoints: (appKey: AppKey) => TransportManagerEndpoints;
  reconnect: ReconnectConfig;
  pingInterval: number;
  keepAliveOnNoListeners?: boolean;
}

function createInitialConnectionState(): SocketState {
  return {
    isConnected: false,
    isReconnecting: false,
    isUnconnectable: false,
    reconnectAttempt: 0,
  };
}

/**
 * Owns websocket channel lifecycle independently from React components.
 *
 * The manager keeps channel sockets stable across transient subscribe/unsubscribe
 * churn. This avoids task websocket disconnects when providers briefly remount
 * or swap listeners during React updates.
 */
export class TransportSubscriptionManager {
  private readonly channelStates = new Map<
    string,
    ChannelState<TransportSubscriptionTopic>
  >();

  private readonly connectionListeners = new Map<
    AppKey,
    Set<(state: SocketState) => void>
  >();

  private readonly pingIntervals = new Map<string, ReturnType<typeof setInterval>>();

  private readonly getEndpoints: TransportSubscriptionManagerOptions['getEndpoints'];

  private readonly reconnect: ReconnectConfig;

  private readonly pingInterval: number;

  private readonly keepAliveOnNoListeners: boolean;

  constructor({
    getEndpoints,
    reconnect,
    pingInterval,
    keepAliveOnNoListeners = true,
  }: TransportSubscriptionManagerOptions) {
    this.getEndpoints = getEndpoints;
    this.reconnect = reconnect;
    this.pingInterval = pingInterval;
    this.keepAliveOnNoListeners = keepAliveOnNoListeners;
  }

  subscribeToMessages = <TTopic extends TransportSubscriptionTopic>(options: {
    appKey: AppKey;
    topic: TTopic;
    listener: (message: TransportTopicMessageMap[TTopic]) => void;
  }): TransportMessageSubscription => {
    const key = this.channelKeyFor(options.appKey, options.topic);
    const state = this.ensureChannelState(options.appKey, options.topic);

    this.channelStates.set(key, state as ChannelState<TransportSubscriptionTopic>);
    state.listeners.add(options.listener);
    state.shouldReconnect = true;
    this.connectChannel(options.appKey, options.topic);

    return {
      unsubscribe: () => {
        state.listeners.delete(options.listener);

        if (state.listeners.size > 0 || this.keepAliveOnNoListeners) {
          return;
        }

        state.shouldReconnect = false;
        if (state.reconnectTimeoutId) {
          clearTimeout(state.reconnectTimeoutId);
          state.reconnectTimeoutId = null;
        }
        this.cleanupSocket(key);
        state.connectionState = createInitialConnectionState();
        this.notifyConnectionListeners(options.appKey);
      },
    };
  };

  subscribeToConnectionState = (
    appKey: AppKey,
    listener: (state: SocketState) => void,
  ) => {
    const listeners = this.connectionListeners.get(appKey) ?? new Set();
    listeners.add(listener);
    this.connectionListeners.set(appKey, listeners);
    this.notifyConnectionListeners(appKey);

    return () => {
      const currentListeners = this.connectionListeners.get(appKey);
      if (!currentListeners) {
        return;
      }

      currentListeners.delete(listener);
      if (currentListeners.size === 0) {
        this.connectionListeners.delete(appKey);
      }
    };
  };

  reconnectSocket = (appKey: AppKey) => {
    (['states', 'locks', 'tasks'] as const).forEach((topic) => {
      const key = this.channelKeyFor(appKey, topic);
      const state = this.channelStates.get(key);

      if (!state) {
        return;
      }

      state.shouldReconnect = true;
      state.connectionState = createInitialConnectionState();
      if (state.reconnectTimeoutId) {
        clearTimeout(state.reconnectTimeoutId);
        state.reconnectTimeoutId = null;
      }
      this.cleanupSocket(key);
      this.connectChannel(appKey, topic);
    });
    this.notifyConnectionListeners(appKey);
  };

  disconnectSocket = (appKey: AppKey) => {
    (['states', 'locks', 'tasks'] as const).forEach((topic) => {
      const key = this.channelKeyFor(appKey, topic);
      const state = this.channelStates.get(key);

      if (!state) {
        return;
      }

      state.shouldReconnect = false;
      if (state.reconnectTimeoutId) {
        clearTimeout(state.reconnectTimeoutId);
        state.reconnectTimeoutId = null;
      }
      this.cleanupSocket(key);
      state.connectionState = createInitialConnectionState();
    });
    this.notifyConnectionListeners(appKey);
  };

  dispose = (appKeys: AppKey[]) => {
    appKeys.forEach((appKey) => this.disconnectSocket(appKey));
    this.channelStates.clear();
    this.connectionListeners.clear();
    this.pingIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.pingIntervals.clear();
  };

  private channelKeyFor(appKey: AppKey, topic: TransportSubscriptionTopic) {
    return `${appKey}:${topic}`;
  }

  private ensureChannelState<TTopic extends TransportSubscriptionTopic>(
    appKey: AppKey,
    topic: TTopic,
  ): ChannelState<TTopic> {
    const key = this.channelKeyFor(appKey, topic);
    const existingState = this.channelStates.get(key) as
      | ChannelState<TTopic>
      | undefined;

    if (existingState) {
      return existingState;
    }

    const nextState: ChannelState<TTopic> = {
      ws: null,
      listeners: new Set(),
      connectionState: createInitialConnectionState(),
      reconnectTimeoutId: null,
      shouldReconnect: true,
    };

    this.channelStates.set(key, nextState as ChannelState<TransportSubscriptionTopic>);
    return nextState;
  }

  private getChannelUrl(appKey: AppKey, topic: TransportSubscriptionTopic) {
    const endpoints = this.getEndpoints(appKey);
    return endpoints[
      topic === 'states'
        ? 'stateWsUrl'
        : topic === 'locks'
          ? 'lockWsUrl'
          : 'taskWsUrl'
    ];
  }

  private notifyConnectionListeners(appKey: AppKey) {
    const listeners = this.connectionListeners.get(appKey);

    if (!listeners || listeners.size === 0) {
      return;
    }

    const states = (['states', 'locks', 'tasks'] as const).map((topic) => {
      const key = this.channelKeyFor(appKey, topic);
      return (
        this.channelStates.get(key)?.connectionState ?? createInitialConnectionState()
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
  }

  private stopPing(key: string) {
    const intervalId = this.pingIntervals.get(key);

    if (!intervalId) {
      return;
    }

    clearInterval(intervalId);
    this.pingIntervals.delete(key);
  }

  private cleanupSocket(key: string) {
    this.stopPing(key);
    const state = this.channelStates.get(key);

    if (!state?.ws) {
      return;
    }

    state.ws.onopen = null;
    state.ws.onmessage = null;
    state.ws.onclose = null;
    state.ws.onerror = null;

    if (
      state.ws.readyState === WebSocket.OPEN
      || state.ws.readyState === WebSocket.CONNECTING
    ) {
      state.ws.close(1000, 'Client cleanup');
    }

    state.ws = null;
  }

  private scheduleReconnect(appKey: AppKey, topic: TransportSubscriptionTopic) {
    const key = this.channelKeyFor(appKey, topic);
    const state = this.channelStates.get(key);

    if (!state) {
      return;
    }

    const nextAttempt = state.connectionState.reconnectAttempt + 1;
    state.connectionState = {
      ...state.connectionState,
      isConnected: false,
      isReconnecting: nextAttempt <= this.reconnect.maxAttempts,
      reconnectAttempt: nextAttempt,
      isUnconnectable: nextAttempt > this.reconnect.maxAttempts,
    };
    this.notifyConnectionListeners(appKey);

    if (nextAttempt > this.reconnect.maxAttempts) {
      return;
    }

    const delay = Math.min(
      this.reconnect.initialDelay
        * Math.pow(this.reconnect.backoffMultiplier, nextAttempt - 1),
      this.reconnect.maxDelay,
    );

    state.reconnectTimeoutId = setTimeout(() => {
      state.reconnectTimeoutId = null;
      if (state.shouldReconnect) {
        this.connectChannel(appKey, topic);
      }
    }, delay);
  }

  private connectChannel(appKey: AppKey, topic: TransportSubscriptionTopic) {
    const key = this.channelKeyFor(appKey, topic);
    const state = this.ensureChannelState(appKey, topic);

    if (state.connectionState.isUnconnectable) {
      this.notifyConnectionListeners(appKey);
      return;
    }

    if (
      state.ws?.readyState === WebSocket.OPEN
      || state.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    const url = this.getChannelUrl(appKey, topic);

    this.cleanupSocket(key);

    const ws = new WebSocket(url);
    state.ws = ws;

    ws.onopen = () => {
      state.connectionState = {
        isConnected: true,
        isReconnecting: false,
        isUnconnectable: false,
        reconnectAttempt: 0,
      };
      this.notifyConnectionListeners(appKey);
      this.stopPing(key);
      this.pingIntervals.set(
        key,
        setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, this.pingInterval),
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
      this.notifyConnectionListeners(appKey);
    };

    ws.onclose = () => {
      this.stopPing(key);
      state.connectionState = {
        ...state.connectionState,
        isConnected: false,
      };
      this.notifyConnectionListeners(appKey);
      if (state.shouldReconnect) {
        this.scheduleReconnect(appKey, topic);
      }
    };
  }
}
