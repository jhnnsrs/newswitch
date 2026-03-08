import { useCallback, useMemo, useRef, type ReactNode } from "react";
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
      actionName: string,
      args: TArgs,
      options?: AssignOptions,
    ): Promise<Task<TArgs, TReturn>> => {
      const reference = options?.reference || createReference();

      addTask(actionName, reference, args, "pending");

      try {
        const data = await transport.assignAction(actionName, args, {
          ...options,
          reference,
        });

        setAssignationID(reference, data.task_id);
        updateTask(reference, { status: data.status });

        return getTaskFromStore<TArgs, TReturn>(reference)!;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown transport error";
        updateTask(reference, { status: "failed", error: message });
        throw error;
      }
    },
    [addTask, createReference, getTaskFromStore, setAssignationID, transport, updateTask],
  );

  const getTask = useCallback(
    async <TArgs = unknown, TReturn = unknown>(
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const task = await transport.fetchTask<TArgs, TReturn>(taskId);
      updateTask(taskId, task);
      return task;
    },
    [transport, updateTask],
  );

  const getCachedTask = useCallback(
    (taskId: string): Task | undefined => getTaskFromStore(taskId),
    [getTaskFromStore],
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus, request: () => Promise<void>) => {
      await request();
      updateTask(taskId, { status });
    },
    [updateTask],
  );

  const cancelTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, "cancelled", () =>
        transport.cancelTaskRequest(taskId),
      );
    },
    [transport, updateTaskStatus],
  );

  const pauseTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, "paused", () =>
        transport.pauseTaskRequest(taskId),
      );
    },
    [transport, updateTaskStatus],
  );

  const unpauseTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, "running", () =>
        transport.unpauseTaskRequest(taskId),
      );
    },
    [transport, updateTaskStatus],
  );

  const stepTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, "running", () =>
        transport.stepTaskRequest(taskId),
      );
    },
    [transport, updateTaskStatus],
  );

  const subscribeToTask = useCallback(
    (taskId: string, callback: (task: Task) => void): (() => void) => {
      return transportStoreApi.subscribe(selectTask(taskId), (task) => {
        if (task) {
          callback(task as Task);
        }
      });
    },
    [transportStoreApi],
  );

  const waitForTask = useCallback(
    <TArgs = unknown, TReturn = unknown>(
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const cachedTask = getTaskFromStore<TArgs, TReturn>(taskId);

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
        const unsubscribe = subscribeToTask(taskId, (task) => {
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
