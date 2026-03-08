import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { toast } from "sonner";
import { useTransportStore, useTransportStoreApi } from "../store";
import {
  FromAgentMessageType,
  type CriticalEvent,
  type DoneEvent,
  type ErrorEvent,
  type ListenTasksMessage,
  type LogEvent,
  type PausedEvent,
  type ProgressEvent,
  type RegisterMessage,
  type ResumedEvent,
  type TaskStatus,
  type YieldEvent,
  type CancelledEvent,
  type InterruptedEvent,
} from "./types";
import { SubscriptionWebSocketManager } from "./SubscriptionWebSocketManager";
import { useTransport } from "./transport-context";

type TaskChannelMessage =
  | RegisterMessage
  | ProgressEvent
  | YieldEvent
  | DoneEvent
  | ErrorEvent
  | CriticalEvent
  | PausedEvent
  | ResumedEvent
  | CancelledEvent
  | InterruptedEvent
  | LogEvent
  | { type: typeof FromAgentMessageType.STEPPED }
  | { type: typeof FromAgentMessageType.HEARTBEAT_ANSWER };

const TERMINAL_TASK_STATUSES = new Set<TaskStatus>([
  "completed",
  "failed",
  "cancelled",
  "interrupted",
]);

export interface TaskWebSocketSyncHandle {
  reconnect: () => void;
  disconnect: () => void;
}

interface TaskWebSocketSyncProps {
  managerRef?: MutableRefObject<TaskWebSocketSyncHandle | null>;
}

export function TaskWebSocketSync({ managerRef }: TaskWebSocketSyncProps) {
  const transport = useTransport();
  const transportStoreApi = useTransportStoreApi();
  const tasks = useTransportStore((state) => state.tasks);
  const setConnected = useTransportStore((state) => state.setConnected);
  const setReconnecting = useTransportStore((state) => state.setReconnecting);
  const setReconnectAttempt = useTransportStore((state) => state.setReconnectAttempt);
  const setUnconnectable = useTransportStore((state) => state.setUnconnectable);
  const resetReconnect = useTransportStore((state) => state.resetReconnect);
  const channelManagerRef = useRef<SubscriptionWebSocketManager<TaskChannelMessage> | null>(null);

  const listeningKeys = useMemo(
    () =>
      Object.values(tasks)
        .filter((task) => !TERMINAL_TASK_STATUSES.has(task.status))
        .map((task) => (task.id !== task.reference ? task.id : null))
        .filter((taskId): taskId is string => taskId !== null),
    [tasks],
  );

  useEffect(() => {
    const manager = new SubscriptionWebSocketManager<TaskChannelMessage>({
      name: "TaskWebSocketSync",
      wsUrl: transport.taskWsUrl,
      pingInterval: transport.pingInterval,
      reconnect: transport.reconnect,
      buildListenMessage: (keys): ListenTasksMessage => ({
        type: "LISTEN_TASKS",
        tasks: keys,
      }),
      onOpen: () => {
        setConnected(true);
        resetReconnect();
      },
      onClose: () => {
        setConnected(false);
      },
      onManualReconnect: () => {
        setReconnectAttempt(0);
        setUnconnectable(false);
        setReconnecting(false);
      },
      onReconnectScheduled: (attempt) => {
        setReconnectAttempt(attempt);
        setReconnecting(true);
      },
      onMaxReconnectAttemptsReached: () => {
        setUnconnectable(true);
        setReconnecting(false);
      },
      onMessage: (message) => {
        const store = transportStoreApi.getState();

        switch (message.type) {
          case FromAgentMessageType.PROGRESS:
            store.updateTask(message.assignation, {
              status: "running",
              progress: message.progress,
              progressMessage: message.message,
            });
            return;
          case FromAgentMessageType.YIELD:
            store.updateTask(message.assignation, {
              status: "running",
              result: message.returns,
            });
            return;
          case FromAgentMessageType.DONE: {
            const existingTask = store.getTask(message.assignation);
            if (existingTask?.notify) {
              toast.success(`Task completed: ${existingTask.action}`, {
                description: `Task ${message.assignation} finished successfully`,
              });
            }
            store.updateTask(message.assignation, {
              status: "completed",
              ...("returns" in message && message.returns !== undefined
                ? { result: message.returns }
                : {}),
            });
            return;
          }
          case FromAgentMessageType.ERROR:
            store.updateTask(message.assignation, {
              status: "failed",
              error: message.error,
            });
            return;
          case FromAgentMessageType.CRITICAL:
            store.updateTask(message.assignation, {
              status: "failed",
              error: message.error,
            });
            toast.error(`Critical error in task: ${message.error}`);
            return;
          case FromAgentMessageType.PAUSED:
            store.updateTask(message.assignation, { status: "paused" });
            return;
          case FromAgentMessageType.RESUMED:
            store.updateTask(message.assignation, { status: "running" });
            return;
          case FromAgentMessageType.CANCELLED:
            store.updateTask(message.assignation, { status: "cancelled" });
            return;
          case FromAgentMessageType.INTERRUPTED:
            store.updateTask(message.assignation, { status: "interrupted" });
            return;
          case FromAgentMessageType.LOG: {
            const logMethod =
              message.level === "ERROR" || message.level === "CRITICAL"
                ? console.error
                : message.level === "WARN"
                  ? console.warn
                  : console.log;
            logMethod(`[Agent Log] [${message.level}] ${message.message}`);
            return;
          }
          case FromAgentMessageType.STEPPED:
          case FromAgentMessageType.REGISTER:
          case FromAgentMessageType.HEARTBEAT_ANSWER:
            return;
          default:
            return;
        }
      },
    });

    manager.connect();
    manager.updateListenKeys(listeningKeys);
    channelManagerRef.current = manager;

    if (managerRef) {
      managerRef.current = {
        reconnect: () => manager.reconnect(),
        disconnect: () => manager.disconnect(),
      };
    }

    return () => {
      manager.disconnect();
      channelManagerRef.current = null;
      if (managerRef) {
        managerRef.current = null;
      }
    };
  }, [
    managerRef,
    resetReconnect,
    setConnected,
    setReconnectAttempt,
    setReconnecting,
    setUnconnectable,
    transport,
    transportStoreApi,
  ]);

  useEffect(() => {
    channelManagerRef.current?.updateListenKeys(listeningKeys);
  }, [listeningKeys]);

  return null;
}