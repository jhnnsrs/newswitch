import { useEffect, useMemo, useRef } from "react";
import type { AppKey } from "@/apps";
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
} from "./types";
import { useTransport } from "./transport-context";

const defaultConnectionState: TransportSocketConnectionState = {
  isConnected: false,
  isReconnecting: false,
  isUnconnectable: false,
  reconnectAttempt: 0,
};

export function TaskWebSocketSync() {
  const transport = useTransport();
  const transportStoreRegistry = useTaskStoreRegistry();
  const runtimeStoreApi = useTransportStoreApi();
  const subscriptionsRef = useRef(new Map<AppKey, TransportMessageSubscription>());
  const connectionSubscriptionsRef = useRef(new Map<AppKey, () => void>());
  const connectionStatesRef = useRef(new Map<AppKey, TransportSocketConnectionState>());

  const appKeys = useMemo(
    () => Object.keys(transport.apps) as AppKey[],
    [transport.apps],
  );

  const syncConnectionState = () => {
    const states = appKeys.map(
      (appKey) => connectionStatesRef.current.get(appKey) ?? defaultConnectionState,
    );
    const runtimeStore = runtimeStoreApi.getState();

    runtimeStore.setConnected(states.some((state) => state.isConnected));
    runtimeStore.setReconnecting(states.some((state) => state.isReconnecting));
    runtimeStore.setUnconnectable(states.some((state) => state.isUnconnectable));
    runtimeStore.setReconnectAttempt(
      states.reduce(
        (maxAttempt, state) => Math.max(maxAttempt, state.reconnectAttempt),
        0,
      ),
    );
  };

  const handleMessage = (appKey: AppKey, message: TaskTransportMessage) => {
    const store = transportStoreRegistry.getStoreApi(appKey).getState();

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
  };

  useEffect(() => {
    for (const appKey of appKeys) {
      const existingSubscription = subscriptionsRef.current.get(appKey);

      if (existingSubscription) {
        continue;
      }

      subscriptionsRef.current.set(
        appKey,
        transport.subscribeToMessages({
          appKey,
          topic: "tasks",
          listener: (message) => handleMessage(appKey, message),
        }),
      );

      if (!connectionSubscriptionsRef.current.has(appKey)) {
        connectionSubscriptionsRef.current.set(
          appKey,
          transport.subscribeToConnectionState(appKey, (state) => {
            connectionStatesRef.current.set(appKey, state);
            syncConnectionState();
          }),
        );
      }
    }

    subscriptionsRef.current.forEach((subscription, appKey) => {
      if (!appKeys.includes(appKey)) {
        subscription.unsubscribe();
        subscriptionsRef.current.delete(appKey);
      }
    });

    connectionSubscriptionsRef.current.forEach((unsubscribe, appKey) => {
      if (!appKeys.includes(appKey)) {
        unsubscribe();
        connectionSubscriptionsRef.current.delete(appKey);
        connectionStatesRef.current.delete(appKey);
      }
    });

    syncConnectionState();
  }, [appKeys, runtimeStoreApi, transport, transportStoreRegistry]);

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;
    const connectionSubscriptions = connectionSubscriptionsRef.current;
    const connectionStates = connectionStatesRef.current;

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      subscriptions.clear();
      connectionSubscriptions.forEach((unsubscribe) => unsubscribe());
      connectionSubscriptions.clear();
      connectionStates.clear();
      const runtimeStore = runtimeStoreApi.getState();
      runtimeStore.setConnected(false);
      runtimeStore.setReconnecting(false);
      runtimeStore.setUnconnectable(false);
      runtimeStore.setReconnectAttempt(0);
    };
  }, [runtimeStoreApi]);

  return null;
}