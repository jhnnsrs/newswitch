import type { AppKey } from '@/apps';
import type {
  LockTransportMessage,
  StateTransportMessage,
  TaskTransportMessage,
  TransportMessageSubscription,
  TransportSocketConnectionState,
  TransportSubscriptionTopic,
  TransportTopicMessageMap,
} from './types';

interface TransportSocketRegistryConfig {
  appKeys: AppKey[];
  getWsUrl: (appKey: AppKey, topic: TransportSubscriptionTopic) => string;
  pingInterval: number;
  reconnect: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
}

type TopicMessageMap = {
  states: StateTransportMessage;
  locks: LockTransportMessage;
  tasks: TaskTransportMessage;
};

type Subscriber<TMessage> = (message: TMessage) => void;

const defaultConnectionState: TransportSocketConnectionState = {
  isConnected: false,
  isReconnecting: false,
  isUnconnectable: false,
  reconnectAttempt: 0,
};

class TopicSocket<TMessage> {
  private readonly wsUrl: string;
  private readonly pingInterval: number;
  private readonly reconnect: TransportSocketRegistryConfig['reconnect'];
  private ws: WebSocket | null = null;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private manuallyDisconnected = false;
  private listeners = new Map<number, Subscriber<TMessage>>();
  private nextListenerId = 1;
  private connectionState: TransportSocketConnectionState = { ...defaultConnectionState };

  constructor(
    private readonly name: string,
    wsUrl: string,
    pingInterval: number,
    reconnect: TransportSocketRegistryConfig['reconnect'],
    private readonly onConnectionStateChange: (
      state: TransportSocketConnectionState,
    ) => void,
  ) {
    this.wsUrl = wsUrl;
    this.pingInterval = pingInterval;
    this.reconnect = reconnect;
  }

  subscribe(listener: Subscriber<TMessage>): TransportMessageSubscription {
    const listenerId = this.nextListenerId++;
    this.listeners.set(listenerId, listener);
    this.manuallyDisconnected = false;
    this.ensureConnected();

    return {
      unsubscribe: () => {
        this.listeners.delete(listenerId);
        this.cleanupIfIdle();
      },
    };
  }

  reconnectSocket() {
    this.manuallyDisconnected = false;
    this.reconnectAttempt = 0;
    this.updateConnectionState({
      isReconnecting: false,
      isUnconnectable: false,
      reconnectAttempt: 0,
    });

    if (this.listeners.size === 0) {
      return;
    }

    this.cleanupSocket();
    this.connect();
  }

  disconnectSocket() {
    this.manuallyDisconnected = true;
    this.cleanupSocket();
    this.updateConnectionState({
      isConnected: false,
      isReconnecting: false,
    });
  }

  destroy() {
    this.disconnectSocket();
    this.listeners.clear();
  }

  getConnectionState() {
    return { ...this.connectionState };
  }

  private ensureConnected() {
    if (this.listeners.size === 0 || this.manuallyDisconnected) {
      return;
    }

    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.connect();
  }

  private connect() {
    this.cleanupSocket();

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.updateConnectionState({
          isConnected: true,
          isReconnecting: false,
          isUnconnectable: false,
          reconnectAttempt: 0,
        });
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as TMessage;
          this.listeners.forEach((listener) => {
            listener(message);
          });
        } catch (error) {
          console.error(`[${this.name}] Failed to parse message:`, error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[${this.name}] Closed:`, event.code, event.reason);
        this.cleanupSocket();
        this.updateConnectionState({ isConnected: false });

        if (!this.manuallyDisconnected && this.listeners.size > 0) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error(`[${this.name}] Error:`, error);
      };
    } catch (error) {
      console.error(`[${this.name}] Failed to create WebSocket:`, error);
    }
  }

  private scheduleReconnect() {
    const nextAttempt = this.reconnectAttempt + 1;
    this.reconnectAttempt = nextAttempt;

    if (nextAttempt > this.reconnect.maxAttempts) {
      this.updateConnectionState({
        isReconnecting: false,
        isUnconnectable: true,
        reconnectAttempt: nextAttempt - 1,
      });
      return;
    }

    this.updateConnectionState({
      isReconnecting: true,
      isUnconnectable: false,
      reconnectAttempt: nextAttempt,
    });

    const delay = this.getReconnectDelay(nextAttempt - 1);
    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;

      if (!this.manuallyDisconnected && this.listeners.size > 0) {
        this.connect();
      }
    }, delay);
  }

  private getReconnectDelay(attempt: number): number {
    const delay = this.reconnect.initialDelay * Math.pow(this.reconnect.backoffMultiplier, attempt);
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.min(delay + jitter, this.reconnect.maxDelay);
  }

  private cleanupIfIdle() {
    if (this.listeners.size > 0) {
      return;
    }

    this.cleanupSocket();
    this.updateConnectionState({
      isConnected: false,
      isReconnecting: false,
      isUnconnectable: false,
      reconnectAttempt: 0,
    });
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingIntervalId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.pingInterval);
  }

  private stopPingInterval() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private cleanupSocket() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.stopPingInterval();

    if (!this.ws) {
      return;
    }

    this.ws.onopen = null;
    this.ws.onclose = null;
    this.ws.onmessage = null;
    this.ws.onerror = null;

    if (
      this.ws.readyState === WebSocket.OPEN ||
      this.ws.readyState === WebSocket.CONNECTING
    ) {
      this.ws.close(1000, 'Client cleanup');
    }

    this.ws = null;
  }

  private updateConnectionState(nextState: Partial<TransportSocketConnectionState>) {
    this.connectionState = {
      ...this.connectionState,
      ...nextState,
    };
    this.onConnectionStateChange(this.getConnectionState());
  }
}

class AppSocketGroup {
  private readonly topicSockets: {
    [K in TransportSubscriptionTopic]: TopicSocket<TopicMessageMap[K]>;
  };
  private readonly connectionListeners = new Map<
    number,
    (state: TransportSocketConnectionState) => void
  >();
  private nextListenerId = 1;

  constructor(
    private readonly appKey: AppKey,
    config: TransportSocketRegistryConfig,
  ) {
    this.topicSockets = {
      states: new TopicSocket<StateTransportMessage>(
        `TransportSocket:${appKey}:states`,
        config.getWsUrl(appKey, 'states'),
        config.pingInterval,
        config.reconnect,
        () => this.emitConnectionState(),
      ),
      locks: new TopicSocket<LockTransportMessage>(
        `TransportSocket:${appKey}:locks`,
        config.getWsUrl(appKey, 'locks'),
        config.pingInterval,
        config.reconnect,
        () => this.emitConnectionState(),
      ),
      tasks: new TopicSocket<TaskTransportMessage>(
        `TransportSocket:${appKey}:tasks`,
        config.getWsUrl(appKey, 'tasks'),
        config.pingInterval,
        config.reconnect,
        () => this.emitConnectionState(),
      ),
    };
  }

  subscribe<TTopic extends TransportSubscriptionTopic>(
    topic: TTopic,
    listener: (message: TopicMessageMap[TTopic]) => void,
  ): TransportMessageSubscription {
    return this.topicSockets[topic].subscribe(listener);
  }

  subscribeToConnectionState(
    listener: (state: TransportSocketConnectionState) => void,
  ): () => void {
    const listenerId = this.nextListenerId++;
    this.connectionListeners.set(listenerId, listener);
    listener(this.getConnectionState());

    return () => {
      this.connectionListeners.delete(listenerId);
    };
  }

  reconnect() {
    Object.values(this.topicSockets).forEach((socket) => socket.reconnectSocket());
  }

  disconnect() {
    Object.values(this.topicSockets).forEach((socket) => socket.disconnectSocket());
  }

  destroy() {
    Object.values(this.topicSockets).forEach((socket) => socket.destroy());
    this.connectionListeners.clear();
  }

  private getConnectionState(): TransportSocketConnectionState {
    const states = Object.values(this.topicSockets).map((socket) => socket.getConnectionState());

    return {
      isConnected: states.some((state) => state.isConnected),
      isReconnecting: states.some((state) => state.isReconnecting),
      isUnconnectable: states.some((state) => state.isUnconnectable),
      reconnectAttempt: states.reduce(
        (maxAttempt, state) => Math.max(maxAttempt, state.reconnectAttempt),
        0,
      ),
    };
  }

  private emitConnectionState() {
    const state = this.getConnectionState();
    this.connectionListeners.forEach((listener) => {
      listener(state);
    });
  }
}

export interface TransportSocketRegistry {
  subscribeToMessages: <TTopic extends TransportSubscriptionTopic>(options: {
    appKey: AppKey;
    topic: TTopic;
    listener: (message: TransportTopicMessageMap[TTopic]) => void;
  }) => TransportMessageSubscription;
  subscribeToConnectionState: (
    appKey: AppKey,
    listener: (state: TransportSocketConnectionState) => void,
  ) => () => void;
  reconnectSocket: (appKey?: AppKey) => void;
  disconnectSocket: (appKey?: AppKey) => void;
  destroy: () => void;
}

export const createTransportSocketRegistry = (
  config: TransportSocketRegistryConfig,
): TransportSocketRegistry => {
  const groups = new Map<AppKey, AppSocketGroup>();

  const getGroup = (appKey: AppKey) => {
    const existingGroup = groups.get(appKey);

    if (existingGroup) {
      return existingGroup;
    }

    const nextGroup = new AppSocketGroup(appKey, config);
    groups.set(appKey, nextGroup);
    return nextGroup;
  };

  const forEachGroup = (
    appKey: AppKey | undefined,
    callback: (group: AppSocketGroup) => void,
  ) => {
    if (appKey) {
      callback(getGroup(appKey));
      return;
    }

    config.appKeys.forEach((key) => {
      callback(getGroup(key));
    });
  };

  return {
    subscribeToMessages: ({ appKey, topic, listener }) =>
      getGroup(appKey).subscribe(topic, listener),
    subscribeToConnectionState: (appKey, listener) =>
      getGroup(appKey).subscribeToConnectionState(listener),
    reconnectSocket: (appKey) => {
      forEachGroup(appKey, (group) => group.reconnect());
    },
    disconnectSocket: (appKey) => {
      forEachGroup(appKey, (group) => group.disconnect());
    },
    destroy: () => {
      groups.forEach((group) => group.destroy());
      groups.clear();
    },
  };
};
