import type { TransportConfig } from "./types";

export interface SubscriptionWebSocketManagerConfig<TMessage> {
  name: string;
  wsUrl: string;
  pingInterval: number;
  reconnect: Required<NonNullable<TransportConfig["reconnect"]>>;
  buildListenMessage: (keys: string[]) => unknown;
  onMessage: (message: TMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onManualReconnect?: () => void;
  onReconnectScheduled?: (attempt: number) => void;
  onMaxReconnectAttemptsReached?: () => void;
}

export class SubscriptionWebSocketManager<TMessage> {
  private ws: WebSocket | null = null;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private listenKeys: string[] = [];
  private listenSignature = "";

  constructor(private readonly config: SubscriptionWebSocketManagerConfig<TMessage>) {}

  updateListenKeys(keys: string[]) {
    const nextKeys = Array.from(new Set(keys)).sort();
    const nextSignature = nextKeys.join("\u0000");

    if (nextSignature === this.listenSignature) {
      return;
    }

    this.listenKeys = nextKeys;
    this.listenSignature = nextSignature;
    this.sendListenMessage();
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.cleanup();
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.config.onOpen?.();
        this.startPingInterval();
        this.sendListenMessage();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as TMessage;
          this.config.onMessage(message);
        } catch (error) {
          console.error(
            `[${this.config.name}] Failed to parse message:`,
            error,
          );
        }
      };

      this.ws.onclose = (event) => {
        console.log(
          `[${this.config.name}] Closed:`,
          event.code,
          event.reason,
        );
        this.stopPingInterval();
        this.config.onClose?.();

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error(`[${this.config.name}] Error:`, error);
      };
    } catch (error) {
      console.error(`[${this.config.name}] Failed to create WebSocket:`, error);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.cleanup();
    this.config.onClose?.();
  }

  reconnect() {
    this.cleanup();
    this.shouldReconnect = true;
    this.reconnectAttempt = 0;
    this.config.onManualReconnect?.();
    setTimeout(() => this.connect(), 100);
  }

  private cleanup() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;

      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close(1000, "Client cleanup");
      }

      this.ws = null;
    }
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingIntervalId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
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
    const attempt = this.getNextReconnectAttempt();

    if (attempt > this.config.reconnect.maxAttempts) {
      this.shouldReconnect = false;
      this.config.onMaxReconnectAttemptsReached?.();
      return;
    }

    this.config.onReconnectScheduled?.(attempt);
    const delay = this.getReconnectDelay(attempt - 1);

    this.reconnectTimeoutId = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  private reconnectAttempt = 0;

  private getNextReconnectAttempt() {
    this.reconnectAttempt += 1;
    return this.reconnectAttempt;
  }

  private getReconnectDelay(attempt: number): number {
    const { initialDelay, backoffMultiplier, maxDelay } = this.config.reconnect;
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.min(delay + jitter, maxDelay);
  }

  private sendListenMessage() {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify(this.config.buildListenMessage(this.listenKeys)));
  }
}