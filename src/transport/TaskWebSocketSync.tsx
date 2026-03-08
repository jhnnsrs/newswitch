import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { AppKey } from "@/apps";
import { toast } from "sonner";
import {
  getRegistryTasks,
  selectRegistryVersion,
  useTransportRuntimeStore,
  useTransportRuntimeStoreApi,
  useTransportStoreRegistry,
} from "@/lib/rekuest/task/store";
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
  const transportStoreRegistry = useTransportStoreRegistry();
  const runtimeStoreApi = useTransportRuntimeStoreApi();
  const registryVersion = useTransportRuntimeStore(selectRegistryVersion);
  const channelManagerRef = useRef<
    Map<AppKey, SubscriptionWebSocketManager<TaskChannelMessage>>
  >(new Map());

  const appKeys = useMemo(
    () => Object.keys(transport.apps) as AppKey[],
    [transport.apps],
  );

  const tasksByApp = useMemo(
    () => getRegistryTasks(transportStoreRegistry),
    [registryVersion, transportStoreRegistry],
  );

  const listeningKeysByApp = useMemo(() => {
    return Object.fromEntries(
      appKeys.map((appKey) => [
        appKey,
        Object.values(tasksByApp[appKey] ?? {})
          .filter((task) => !TERMINAL_TASK_STATUSES.has(task.status) && task.id !== task.reference)
          .map((task) => task.id),
      ]),
    ) as Record<AppKey, string[]>;
  }, [appKeys, tasksByApp]);

  useEffect(() => {
    const managers = new Map<AppKey, SubscriptionWebSocketManager<TaskChannelMessage>>();

    for (const appKey of appKeys) {
      const endpoints = transport.getEndpoints(appKey);
      const manager = new SubscriptionWebSocketManager<TaskChannelMessage>({
        name: `TaskWebSocketSync:${appKey}`,
        wsUrl: endpoints.taskWsUrl,
        pingInterval: transport.pingInterval,
        reconnect: transport.reconnect,
        buildListenMessage: (keys): ListenTasksMessage => ({
          type: "LISTEN_TASKS",
          tasks: keys,
        }),
        onOpen: () => {
          runtimeStoreApi.getState().setConnected(true);
          runtimeStoreApi.getState().resetReconnect();
        },
        onClose: () => {
          runtimeStoreApi.getState().setConnected(false);
        },
        onManualReconnect: () => {
          runtimeStoreApi.getState().setReconnectAttempt(0);
          runtimeStoreApi.getState().setUnconnectable(false);
          runtimeStoreApi.getState().setReconnecting(false);
        },
        onReconnectScheduled: (attempt) => {
          runtimeStoreApi.getState().setReconnectAttempt(attempt);
          runtimeStoreApi.getState().setReconnecting(true);
        },
        onMaxReconnectAttemptsReached: () => {
          runtimeStoreApi.getState().setUnconnectable(true);
          runtimeStoreApi.getState().setReconnecting(false);
        },
        onMessage: (message) => {
          const store = transportStoreRegistry.getStoreApi(appKey).getState();

          switch (message.type) {
            case FromAgentMessageType.PROGRESS:
              store.updateTask(
                message.assignation,
                {
                  status: "running",
                  progress: message.progress,
                  progressMessage: message.message,
                },
              );
              return;
            case FromAgentMessageType.YIELD:
              store.updateTask(
                message.assignation,
                {
                  status: "running",
                  result: message.returns,
                },
              );
              return;
            case FromAgentMessageType.DONE: {
              const existingTask = store.getTask(message.assignation);
              if (existingTask?.notify) {
                toast.success(`Task completed: ${existingTask.action}`, {
                  description: `Task ${message.assignation} finished successfully`,
                });
              }
              store.updateTask(
                message.assignation,
                {
                  status: "completed",
                  ...("returns" in message && message.returns !== undefined
                    ? { result: message.returns }
                    : {}),
                },
              );
              return;
            }
            case FromAgentMessageType.ERROR:
              store.updateTask(
                message.assignation,
                {
                  status: "failed",
                  error: message.error,
                },
              );
              return;
            case FromAgentMessageType.CRITICAL:
              store.updateTask(
                message.assignation,
                {
                  status: "failed",
                  error: message.error,
                },
              );
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
      manager.updateListenKeys(listeningKeysByApp[appKey]);
      managers.set(appKey, manager);
    }

    channelManagerRef.current = managers;

    if (managerRef) {
      managerRef.current = {
        reconnect: () => {
          managers.forEach((manager) => manager.reconnect());
        },
        disconnect: () => {
          managers.forEach((manager) => manager.disconnect());
        },
      };
    }

    return () => {
      managers.forEach((manager) => manager.disconnect());
      channelManagerRef.current = new Map();
      if (managerRef) {
        managerRef.current = null;
      }
    };
  }, [
    appKeys,
    listeningKeysByApp,
    managerRef,
    runtimeStoreApi,
    transport,
    transportStoreRegistry,
  ]);

  useEffect(() => {
    channelManagerRef.current.forEach((manager, appKey) => {
      manager.updateListenKeys(listeningKeysByApp[appKey] ?? []);
    });
  }, [listeningKeysByApp]);

  return null;
}