// src/transport/WebSocketManager.ts
import type { Operation } from 'fast-json-patch';
import { useGlobalStateStore } from '../store/stateStore';
import { useTransportStore } from '../store/transportStore';
import { FromAgentMessageType, type FromAgentMessage } from './types';
import { toast } from 'sonner';

export interface WebSocketConfig {
  wsUrl: string;
  pingInterval: number;
  reconnect: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
}

/**
 * WebSocket connection manager - handles all WebSocket logic outside of React
 * This prevents re-renders from affecting the connection state
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private config: WebSocketConfig;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  updateConfig(config: WebSocketConfig) {
    this.config = config;
  }

  connect() {
    const transportStore = useTransportStore.getState();
    
    // Don't connect if already unconnectable
    if (transportStore.isUnconnectable) {
      console.log('[WebSocketManager] Skipping connect - marked as unconnectable');
      return;
    }

    // Don't connect if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocketManager] Already connected');
      return;
    }

    // Cleanup existing connection
    this.cleanup();

    console.log('[WebSocketManager] Connecting to:', this.config.wsUrl);

    try {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocketManager] Connected');
        const store = useTransportStore.getState();
        store.setConnected(true);
        store.resetReconnect();

        // Start ping interval
        this.startPingInterval();
      };

      this.ws.onmessage = this.handleMessage.bind(this);

      this.ws.onclose = (event) => {
        console.log('[WebSocketManager] Closed:', event.code, event.reason);
        const store = useTransportStore.getState();
        store.setConnected(false);

        this.stopPingInterval();

        // Attempt reconnection
        if (this.shouldReconnect && !store.isUnconnectable) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketManager] Error:', error);
      };
    } catch (error) {
      console.error('[WebSocketManager] Failed to create WebSocket:', error);
    }
  }

  disconnect() {
    console.log('[WebSocketManager] Disconnecting');
    this.shouldReconnect = false;
    this.cleanup();

    const store = useTransportStore.getState();
    store.setConnected(false);
    store.setReconnecting(false);
  }

  reconnect() {
    console.log('[WebSocketManager] Manual reconnect');
    const store = useTransportStore.getState();
    
    // Reset all state
    this.shouldReconnect = true;
    store.setReconnectAttempt(0);
    store.setUnconnectable(false);
    store.setReconnecting(false);
    
    this.cleanup();
    
    // Connect after small delay
    setTimeout(() => {
      this.connect();
    }, 100);
  }

  private cleanup() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      // Remove handlers to prevent callbacks after cleanup
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client cleanup');
      }
      this.ws = null;
    }
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingIntervalId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.pingInterval);
  }

  private stopPingInterval() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private scheduleReconnect() {
    const store = useTransportStore.getState();
    const nextAttempt = store.incrementReconnectAttempt();

    if (nextAttempt <= this.config.reconnect.maxAttempts) {
      store.setReconnecting(true);
      const delay = this.getReconnectDelay(nextAttempt - 1);
      console.log(
        `[WebSocketManager] Reconnecting in ${Math.round(delay)}ms (attempt ${nextAttempt}/${this.config.reconnect.maxAttempts})`
      );

      this.reconnectTimeoutId = setTimeout(() => {
        const currentStore = useTransportStore.getState();
        if (this.shouldReconnect && !currentStore.isUnconnectable) {
          this.connect();
        }
      }, delay);
    } else {
      console.error('[WebSocketManager] Max reconnection attempts reached');
      this.shouldReconnect = false;
      store.setUnconnectable(true);
    }
  }

  private getReconnectDelay(attempt: number): number {
    const { initialDelay, backoffMultiplier, maxDelay } = this.config.reconnect;
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.min(delay + jitter, maxDelay);
  }

  private handleMessage(event: MessageEvent) {
    try {
      console.log('[WebSocketManager] Message:', event.data);
      const message: FromAgentMessage = JSON.parse(event.data);
      const transportStore = useTransportStore.getState();
      const globalStateStore = useGlobalStateStore.getState();

      switch (message.type) {
        case FromAgentMessageType.PROGRESS: {
          transportStore.updateTask(message.assignation, {
            status: 'running',
            progress: message.progress,
            progressMessage: message.message,
          });
          break;
        }

        case FromAgentMessageType.YIELD: {
          transportStore.updateTask(message.assignation, {
            status: 'running',
            result: message.returns,
          });
          break;
        }

        case FromAgentMessageType.LOCK: {
          const stateStore = useGlobalStateStore.getState();
          stateStore.setLock(message.key, message.assignation);
          console.log(`[WebSocketManager] Locked state "${message.key}" with assigniation ID "${message.assignation}"`);
          break;
        }

        case FromAgentMessageType.UNLOCK: {
          const stateStore = useGlobalStateStore.getState();
          stateStore.setLock(message.key, undefined);
          console.log(`[WebSocketManager] Unlocked state "${message.key}"`);
          break;
        }

        case FromAgentMessageType.DONE: {

          const existingTask = transportStore.getTask(message.assignation);
          if (existingTask?.notify) {
            toast.success(`Task completed: ${existingTask.action}`, {
              description: `Task ${message.assignation} finished successfully`,
            });
          }

          transportStore.updateTask(message.assignation, {
            status: 'completed',
          });
          
          break;
        }

        case FromAgentMessageType.ERROR: {
          transportStore.updateTask(message.assignation, {
            status: 'failed',
            error: message.error,
          });
          
          break;
        }

        case FromAgentMessageType.CRITICAL: {
          transportStore.updateTask(message.assignation, {
            status: 'failed',
            error: message.error,
          });
          console.error('[WebSocketManager] Critical error:', message.error);
          
          break;
        }

        case FromAgentMessageType.PAUSED: {
          transportStore.updateTask(message.assignation, {
            status: 'paused',
          });
          break;
        }

        case FromAgentMessageType.RESUMED: {
          transportStore.updateTask(message.assignation, {
            status: 'running',
          });
          break;
        }

        case FromAgentMessageType.CANCELLED: {
          transportStore.updateTask(message.assignation, {
            status: 'cancelled',
          });
          
          break;
        }

        case FromAgentMessageType.INTERRUPTED: {
          transportStore.updateTask(message.assignation, {
            status: 'interrupted',
          });
          
          break;
        }

        case FromAgentMessageType.STEPPED: {
          console.log('[WebSocketManager] Stepped event received');
          break;
        }

        case FromAgentMessageType.LOG: {
          const logMethod =
            message.level === 'ERROR' || message.level === 'CRITICAL'
              ? console.error
              : message.level === 'WARN'
              ? console.warn
              : console.log;
          logMethod(`[Agent Log] [${message.level}] ${message.message}`);
          break;
        }

        case FromAgentMessageType.HEARTBEAT_ANSWER: {
          break;
        }

        case FromAgentMessageType.REGISTER: {
          console.log('[WebSocketManager] Agent registered:', message.instance_id);
          break;
        }

        case FromAgentMessageType.STATE_UPDATE: {
          globalStateStore.setState(message.state, message.value);
          break;
        }

        case FromAgentMessageType.STATE_PATCH: {
          const stateName = message.interface;
          const patchOperations: Operation[] = JSON.parse(message.patch);
          globalStateStore.applyJsonPatch(stateName, patchOperations);
          console.log(`[WebSocketManager] Applied patch to state ${stateName}`);
          break;
        }

        default: {
          const _exhaustiveCheck: never = message;
          console.warn(
            '[WebSocketManager] Unknown message type:',
            (_exhaustiveCheck as FromAgentMessage).type
          );
        }
      }
    } catch (error) {
      console.error('[WebSocketManager] Failed to parse message:', error);
    }
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocketManager] Cannot send - not connected');
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(config?: WebSocketConfig): WebSocketManager {
  if (!wsManager && config) {
    wsManager = new WebSocketManager(config);
  } else if (wsManager && config) {
    wsManager.updateConfig(config);
  }
  
  if (!wsManager) {
    throw new Error('WebSocketManager not initialized - config required');
  }
  
  return wsManager;
}

export function destroyWebSocketManager() {
  if (wsManager) {
    wsManager.disconnect();
    wsManager = null;
  }
}
