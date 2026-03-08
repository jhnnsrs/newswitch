import { useCallback, useEffect, useRef } from "react";
import type { AppKey } from "@/lib/rekuest/types";
import { toast } from "sonner";
import {
  useTaskStoreRegistry,
} from "@/lib/rekuest/task/store";
import { useTransportStoreApi } from "@/lib/rekuest/transport/store";
import {
  TaskEventType,
  type TransportMessageSubscription,
  type TransportSocketConnectionState,
  type TaskTransportMessage,
} from "@/lib/rekuest/transport/types";
import { useTransport } from "../transport/transport-context";

const defaultConnectionState: TransportSocketConnectionState = {
  isConnected: false,
  isReconnecting: false,
  isUnconnectable: false,
  reconnectAttempt: 0,
};

export interface TaskWebSocketSyncProps {
  appKey: AppKey;
}

export function TaskWebSocketSync({ appKey }: TaskWebSocketSyncProps) {
  const transport = useTransport();
  const taskStoreRegistry = useTaskStoreRegistry();
  const runtimeStoreApi = useTransportStoreApi();
  const subscriptionRef = useRef<TransportMessageSubscription | null>(null);
  const connectionSubscriptionRef = useRef<(() => void) | null>(null);
  const connectionStateRef = useRef<TransportSocketConnectionState>(
    defaultConnectionState,
  );

  const syncConnectionState = useCallback(() => {
    const runtimeStore = runtimeStoreApi.getState();
    const state = connectionStateRef.current;

    runtimeStore.setConnected(state.isConnected);
    runtimeStore.setReconnecting(state.isReconnecting);
    runtimeStore.setUnconnectable(state.isUnconnectable);
    runtimeStore.setReconnectAttempt(state.reconnectAttempt);
  }, [runtimeStoreApi]);

  const handleMessage = useCallback((appKey: AppKey, message: TaskTransportMessage) => {
    const store = taskStoreRegistry.getStoreApi(appKey).getState();

    switch (message.type) {
      case TaskEventType.PROGRESS:
        store.updateTask(message.assignation, {
          status: "running",
          progress: message.progress,
          progressMessage: message.message,
        });
        return;
      case TaskEventType.YIELD:
        store.updateTask(message.assignation, {
          status: "running",
          result: message.returns,
        });
        return;
      case TaskEventType.DONE: {
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
      case TaskEventType.ERROR:
        store.updateTask(message.assignation, {
          status: "failed",
          error: message.error,
        });
        return;
      case TaskEventType.CRITICAL:
        store.updateTask(message.assignation, {
          status: "failed",
          error: message.error,
        });
        toast.error(`Critical error in task: ${message.error}`);
        return;
      case TaskEventType.PAUSED:
        store.updateTask(message.assignation, { status: "paused" });
        return;
      case TaskEventType.RESUMED:
        store.updateTask(message.assignation, { status: "running" });
        return;
      case TaskEventType.CANCELLED:
        store.updateTask(message.assignation, { status: "cancelled" });
        return;
      case TaskEventType.INTERRUPTED:
        store.updateTask(message.assignation, { status: "interrupted" });
        return;
      case TaskEventType.LOG: {
        const logMethod =
          message.level === "ERROR" || message.level === "CRITICAL"
            ? console.error
            : message.level === "WARN"
              ? console.warn
              : console.log;
        logMethod(`[Agent Log] [${message.level}] ${message.message}`);
        return;
      }
    }
  }, [taskStoreRegistry]);

  useEffect(() => {
    subscriptionRef.current?.unsubscribe();
    connectionSubscriptionRef.current?.();

    subscriptionRef.current = transport.subscribeToMessages({
      appKey,
      topic: "tasks",
      listener: (message) => handleMessage(appKey, message),
    });

    connectionSubscriptionRef.current = transport.subscribeToConnectionState(
      appKey,
      (state) => {
        connectionStateRef.current = state;
        syncConnectionState();
      },
    );

    syncConnectionState();
    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      connectionSubscriptionRef.current?.();
      connectionSubscriptionRef.current = null;
      connectionStateRef.current = defaultConnectionState;
      const runtimeStore = runtimeStoreApi.getState();
      runtimeStore.setConnected(false);
      runtimeStore.setReconnecting(false);
      runtimeStore.setUnconnectable(false);
      runtimeStore.setReconnectAttempt(0);
    };
  }, [appKey, runtimeStoreApi, taskStoreRegistry, transport]);

  return null;
}