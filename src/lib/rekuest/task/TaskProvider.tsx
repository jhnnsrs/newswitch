import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import {
  getRegistryTasks,
  selectTask,
  useTaskStoreRegistry,
} from '@/lib/rekuest/task/store';
import {
  selectIsConnected,
  selectIsReconnecting,
  selectReconnectAttempt,
  selectRegistryVersion,
  useTransportStore,
} from '@/lib/rekuest/transport/store';
import { TaskContext } from './task-context';
import {
  TransportWebSocketSync,
  type TransportWebSocketSyncHandle,
} from '@/lib/rekuest/syncs/TransportWebSocketSync';
import { useTransport } from '@/lib/rekuest/transport/transport-context';
import type {
  AssignOptions,
  Task,
  TaskContextValue,
  TaskStatus,
} from '@/transport/types';

export interface TaskProviderProps {
  children: ReactNode;
}

type AssignAppKey = Parameters<TaskContextValue['assign']>[0];
type CachedTaskAppKey = Parameters<TaskContextValue['getCachedTask']>[1];
type SubscribeAppKey = Parameters<TaskContextValue['subscribeToTask']>[1];
type WaitForTaskAppKey = Parameters<TaskContextValue['waitForTask']>[0];

export function TaskProvider({ children }: TaskProviderProps) {
  const transport = useTransport();
  const taskStoreRegistry = useTaskStoreRegistry();
  const managerRef = useRef<TransportWebSocketSyncHandle | null>(null);

  const isConnected = useTransportStore(selectIsConnected);
  const isReconnecting = useTransportStore(selectIsReconnecting);
  const reconnectAttempt = useTransportStore(selectReconnectAttempt);
  const registryVersion = useTransportStore(selectRegistryVersion);

  const createReference = useCallback(() => {
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const assign: TaskContextValue['assign'] = useCallback(
    async <TArgs, TReturn>(
      appKey: AssignAppKey,
      actionName: string,
      args: TArgs,
      options?: AssignOptions,
    ): Promise<Task<TArgs, TReturn>> => {
      const storeApi = taskStoreRegistry.getStoreApi(appKey);
      const reference = options?.reference || createReference();

      storeApi.getState().addTask(actionName, reference, args, 'pending');

      try {
        const data = await transport.assignAction(appKey, actionName, args, {
          ...options,
          reference,
        });

        storeApi.getState().setAssignationID(reference, data.task_id);
        storeApi.getState().updateTask(reference, { status: data.status });

        return storeApi.getState().getTask<TArgs, TReturn>(reference)!;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown transport error';
        storeApi.getState().updateTask(reference, {
          status: 'failed',
          error: message,
        });
        throw error;
      }
    },
    [createReference, taskStoreRegistry, transport],
  );

  const getTask: TaskContextValue['getTask'] = useCallback(
    async <TArgs = unknown, TReturn = unknown>(
      appKey: AssignAppKey,
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const task = await transport.fetchTask<TArgs, TReturn>(appKey, taskId);
      taskStoreRegistry.getStoreApi(appKey).getState().updateTask(taskId, task);
      return task;
    },
    [taskStoreRegistry, transport],
  );

  const getCachedTask = useCallback(
    (taskId: string, appKey?: CachedTaskAppKey): Task | undefined =>
      taskStoreRegistry.getStoreApi(appKey).getState().getTask(taskId),
    [taskStoreRegistry],
  );

  const updateTaskStatus = useCallback(
    async (
      taskId: string,
      status: TaskStatus,
      request: () => Promise<void>,
      appKey?: CachedTaskAppKey,
    ) => {
      await request();
      taskStoreRegistry.getStoreApi(appKey).getState().updateTask(taskId, { status });
    },
    [taskStoreRegistry],
  );

  const cancelTask = useCallback(
    async (appKey: AssignAppKey, taskId: string) => {
      await updateTaskStatus(
        taskId,
        'cancelled',
        () => transport.cancelTaskRequest(appKey, taskId),
        appKey,
      );
    },
    [transport, updateTaskStatus],
  );

  const pauseTask = useCallback(
    async (appKey: AssignAppKey, taskId: string) => {
      await updateTaskStatus(
        taskId,
        'paused',
        () => transport.pauseTaskRequest(appKey, taskId),
        appKey,
      );
    },
    [transport, updateTaskStatus],
  );

  const unpauseTask = useCallback(
    async (appKey: AssignAppKey, taskId: string) => {
      await updateTaskStatus(
        taskId,
        'running',
        () => transport.unpauseTaskRequest(appKey, taskId),
        appKey,
      );
    },
    [transport, updateTaskStatus],
  );

  const stepTask = useCallback(
    async (appKey: AssignAppKey, taskId: string) => {
      await updateTaskStatus(
        taskId,
        'running',
        () => transport.stepTaskRequest(appKey, taskId),
        appKey,
      );
    },
    [transport, updateTaskStatus],
  );

  const subscribeToTask = useCallback(
    (
      taskId: string,
      appKey: SubscribeAppKey,
      callback: (task: Task) => void,
    ): (() => void) => {
      const storeApi = taskStoreRegistry.getStoreApi(appKey);

      return storeApi.subscribe((state, previousState) => {
        const task = selectTask(taskId)(state);
        const previousTask = selectTask(taskId)(previousState);

        if (task && task !== previousTask) {
          callback(task as Task);
        }
      });
    },
    [taskStoreRegistry],
  );

  const waitForTask: TaskContextValue['waitForTask'] = useCallback(
    <TArgs = unknown, TReturn = unknown>(
      appKey: WaitForTaskAppKey,
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const cachedTask = taskStoreRegistry
        .getStoreApi(appKey)
        .getState()
        .getTask<TArgs, TReturn>(taskId);

      if (cachedTask?.status === 'completed') {
        return Promise.resolve(cachedTask);
      }

      if (cachedTask?.status === 'failed') {
        return Promise.reject(new Error(cachedTask.error || 'Task failed'));
      }

      if (
        cachedTask?.status === 'cancelled' ||
        cachedTask?.status === 'interrupted'
      ) {
        return Promise.reject(new Error(`Task was ${cachedTask.status}`));
      }

      return new Promise<Task<TArgs, TReturn>>((resolve, reject) => {
        const unsubscribe = subscribeToTask(taskId, appKey, (task) => {
          const typedTask = task as Task<TArgs, TReturn>;

          if (typedTask.status === 'completed') {
            unsubscribe();
            resolve(typedTask);
            return;
          }

          if (typedTask.status === 'failed') {
            unsubscribe();
            reject(new Error(typedTask.error || 'Task failed'));
            return;
          }

          if (
            typedTask.status === 'cancelled' ||
            typedTask.status === 'interrupted'
          ) {
            unsubscribe();
            reject(new Error(`Task was ${typedTask.status}`));
          }
        });
      });
    },
    [subscribeToTask, taskStoreRegistry],
  );

  const reconnect = useCallback(() => {
    managerRef.current?.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect();
  }, []);

  void registryVersion;

  const tasks = getRegistryTasks(taskStoreRegistry);

  const tasksMap = useMemo(() => {
    const map = new Map<string, Task>();
    for (const [appKey, appTasks] of Object.entries(tasks)) {
      for (const [reference, task] of Object.entries(appTasks)) {
        map.set(`${appKey}:${reference}`, task);
      }
    }
    return map;
  }, [tasks]);

  const contextValue = useMemo<TaskContextValue>(
    () => ({
      apiEndpoint: transport.apiEndpoint,
      wsUrl: transport.wsUrl,
      isConnected,
      isReconnecting,
      reconnectAttempt,
      tasks: tasksMap,
      assign,
      getTask,
      getCachedTask,
      subscribeToTask,
      waitForTask,
      createReference,
      cancelTask,
      pauseTask,
      unpauseTask,
      stepTask,
      reconnect,
      disconnect,
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
      transport.wsUrl,
      unpauseTask,
      waitForTask,
    ],
  );

  return (
    <TaskContext.Provider value={contextValue}>
      <TransportWebSocketSync ref={managerRef} />
      {children}
    </TaskContext.Provider>
  );
}
