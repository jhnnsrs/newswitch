import { useCallback, useMemo, useRef, type ReactNode } from "react";
import type { AppKey } from "@/apps";
import { getScopedTaskReference } from "@/lib/rekuest/task";
import {
  selectTask,
  useTransportStore,
  useTransportStoreApi,
} from "../store";
import { ActionContext } from "./action-context";
import {
  TransportWebSocketSync,
  type TransportWebSocketSyncHandle,
} from "./TransportWebSocketSync";
import { useTransport } from "./transport-context";
import type { AssignOptions, Task, TaskStatus, ActionContextValue } from "./types";

interface ActionProviderProps {
  children: ReactNode;
}

export function ActionProvider({ children }: ActionProviderProps) {
  const transport = useTransport();
  const transportStoreApi = useTransportStoreApi();
  const managerRef = useRef<TransportWebSocketSyncHandle | null>(null);

  const isConnected = useTransportStore((s) => s.isConnected);
  const isReconnecting = useTransportStore((s) => s.isReconnecting);
  const reconnectAttempt = useTransportStore((s) => s.reconnectAttempt);
  const tasks = useTransportStore((s) => s.tasks);

  const addTask = useTransportStore((s) => s.addTask);
  const updateTask = useTransportStore((s) => s.updateTask);
  const getTaskFromStore = useTransportStore((s) => s.getTask);
  const setAssignationID = useTransportStore((s) => s.setAssignationID);

  const createReference = useCallback(() => {
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const assign = useCallback(
    async <TArgs, TReturn>(
      appKey: AppKey,
      actionName: string,
      args: TArgs,
      options?: AssignOptions,
    ): Promise<Task<TArgs, TReturn>> => {
      const reference = options?.reference || createReference();
      const scopedReference = getScopedTaskReference(appKey, reference);

      addTask(appKey, actionName, reference, args, "pending");

      try {
        const data = await transport.assignAction(appKey, actionName, args, {
          ...options,
          reference,
        });

        setAssignationID(appKey, reference, data.task_id);
        updateTask(scopedReference, { status: data.status }, appKey);

        return getTaskFromStore<TArgs, TReturn>(scopedReference, appKey)!;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown transport error";
        updateTask(scopedReference, { status: "failed", error: message }, appKey);
        throw error;
      }
    },
    [addTask, createReference, getTaskFromStore, setAssignationID, transport, updateTask],
  );

  const getTask = useCallback(
    async <TArgs = unknown, TReturn = unknown>(
      appKey: AppKey,
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const task = await transport.fetchTask<TArgs, TReturn>(appKey, taskId);
      updateTask(taskId, task, appKey);
      return task;
    },
    [transport, updateTask],
  );

  const getCachedTask = useCallback(
    (taskId: string, appKey?: AppKey): Task | undefined =>
      getTaskFromStore(taskId, appKey),
    [getTaskFromStore],
  );

  const updateTaskStatus = useCallback(
    async (
      taskId: string,
      status: TaskStatus,
      request: () => Promise<void>,
      appKey?: AppKey,
    ) => {
      await request();
      updateTask(taskId, { status }, appKey);
    },
    [updateTask],
  );

  const cancelTask = useCallback(
    async (appKey: AppKey, taskId: string) => {
      await updateTaskStatus(taskId, "cancelled", () =>
        transport.cancelTaskRequest(appKey, taskId),
        appKey,
      );
    },
    [transport, updateTaskStatus],
  );

  const pauseTask = useCallback(
    async (appKey: AppKey, taskId: string) => {
      await updateTaskStatus(taskId, "paused", () =>
        transport.pauseTaskRequest(appKey, taskId),
        appKey,
      );
    },
    [transport, updateTaskStatus],
  );

  const unpauseTask = useCallback(
    async (appKey: AppKey, taskId: string) => {
      await updateTaskStatus(taskId, "running", () =>
        transport.unpauseTaskRequest(appKey, taskId),
        appKey,
      );
    },
    [transport, updateTaskStatus],
  );

  const stepTask = useCallback(
    async (appKey: AppKey, taskId: string) => {
      await updateTaskStatus(taskId, "running", () =>
        transport.stepTaskRequest(appKey, taskId),
        appKey,
      );
    },
    [transport, updateTaskStatus],
  );

  const subscribeToTask = useCallback(
    (
      taskId: string,
      appKey: AppKey,
      callback: (task: Task) => void,
    ): (() => void) => {
      return transportStoreApi.subscribe(selectTask(taskId, appKey), (task) => {
        if (task) {
          callback(task as Task);
        }
      });
    },
    [transportStoreApi],
  );

  const waitForTask = useCallback(
    <TArgs = unknown, TReturn = unknown>(
      appKey: AppKey,
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const cachedTask = getTaskFromStore<TArgs, TReturn>(taskId, appKey);

      if (cachedTask?.status === "completed") {
        return Promise.resolve(cachedTask);
      }

      if (cachedTask?.status === "failed") {
        return Promise.reject(new Error(cachedTask.error || "Task failed"));
      }

      if (
        cachedTask?.status === "cancelled" ||
        cachedTask?.status === "interrupted"
      ) {
        return Promise.reject(new Error(`Task was ${cachedTask.status}`));
      }

      return new Promise<Task<TArgs, TReturn>>((resolve, reject) => {
        const unsubscribe = subscribeToTask(taskId, appKey, (task) => {
          const typedTask = task as Task<TArgs, TReturn>;

          if (typedTask.status === "completed") {
            unsubscribe();
            resolve(typedTask);
            return;
          }

          if (typedTask.status === "failed") {
            unsubscribe();
            reject(new Error(typedTask.error || "Task failed"));
            return;
          }

          if (
            typedTask.status === "cancelled" ||
            typedTask.status === "interrupted"
          ) {
            unsubscribe();
            reject(new Error(`Task was ${typedTask.status}`));
          }
        });
      });
    },
    [getTaskFromStore, subscribeToTask],
  );

  const reconnect = useCallback(() => {
    managerRef.current?.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect();
  }, []);

  const tasksMap = useMemo(() => {
    const map = new Map<string, Task>();
    for (const [id, task] of Object.entries(tasks)) {
      map.set(id, task);
    }
    return map;
  }, [tasks]);

  const contextValue = useMemo<ActionContextValue>(
    () => ({
      apiEndpoint: transport.apiEndpoint,
      assign,
      cancelTask,
      createReference,
      disconnect,
      getCachedTask,
      getTask,
      isConnected,
      isReconnecting,
      pauseTask,
      reconnect,
      reconnectAttempt,
      stepTask,
      subscribeToTask,
      tasks: tasksMap,
      unpauseTask,
      waitForTask,
    }),
    [
      assign,
      cancelTask,
      createReference,
      disconnect,
      getCachedTask,
      getTask,
      isConnected,
      isReconnecting,
      pauseTask,
      reconnect,
      reconnectAttempt,
      stepTask,
      subscribeToTask,
      tasksMap,
      transport.apiEndpoint,
      unpauseTask,
      waitForTask,
    ],
  );

  return (
    <ActionContext.Provider value={contextValue}>
      <TransportWebSocketSync managerRef={managerRef} />
      {children}
    </ActionContext.Provider>
  );
}
