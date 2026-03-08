import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import {
  getRegistryTasks,
  selectIsConnected,
  selectIsReconnecting,
  selectReconnectAttempt,
  selectRegistryVersion,
  selectTask,
  useTransportRuntimeStore,
  useTransportStoreRegistry,
} from '@/lib/rekuest/task/store';
import { ActionContext } from '@/transport/action-context';
import {
  TransportWebSocketSync,
  type TransportWebSocketSyncHandle,
} from '@/transport/TransportWebSocketSync';
import { useTransport } from '@/transport/transport-context';
import type {
  AssignOptions,
  Task,
  TaskStatus,
  ActionContextValue,
} from '@/transport/types';

export interface ActionProviderProps {
  children: ReactNode;
}

type AssignAppKey = Parameters<ActionContextValue['assign']>[0];
type CachedTaskAppKey = Parameters<ActionContextValue['getCachedTask']>[1];
type SubscribeAppKey = Parameters<ActionContextValue['subscribeToTask']>[1];
type WaitForTaskAppKey = Parameters<ActionContextValue['waitForTask']>[0];

export function ActionProvider({ children }: ActionProviderProps) {
  const transport = useTransport();
  const transportStoreRegistry = useTransportStoreRegistry();
  const managerRef = useRef<TransportWebSocketSyncHandle | null>(null);

  const isConnected = useTransportRuntimeStore(selectIsConnected);
  const isReconnecting = useTransportRuntimeStore(selectIsReconnecting);
  const reconnectAttempt = useTransportRuntimeStore(selectReconnectAttempt);
  const registryVersion = useTransportRuntimeStore(selectRegistryVersion);

  const createReference = useCallback(() => {
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const assign: ActionContextValue['assign'] = useCallback(
    async <TArgs, TReturn>(
      appKey: AssignAppKey,
      actionName: string,
      args: TArgs,
      options?: AssignOptions,
    ): Promise<Task<TArgs, TReturn>> => {
      const storeApi = transportStoreRegistry.getStoreApi(appKey);
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
    [createReference, transport, transportStoreRegistry],
  );

  const getTask: ActionContextValue['getTask'] = useCallback(
    async <TArgs = unknown, TReturn = unknown>(
      appKey: AssignAppKey,
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const task = await transport.fetchTask<TArgs, TReturn>(appKey, taskId);
      transportStoreRegistry.getStoreApi(appKey).getState().updateTask(taskId, task);
      return task;
    },
    [transport, transportStoreRegistry],
  );

  const getCachedTask = useCallback(
    (taskId: string, appKey?: CachedTaskAppKey): Task | undefined =>
      transportStoreRegistry.getStoreApi(appKey).getState().getTask(taskId),
    [transportStoreRegistry],
  );

  const updateTaskStatus = useCallback(
    async (
      taskId: string,
      status: TaskStatus,
      request: () => Promise<void>,
      appKey?: CachedTaskAppKey,
    ) => {
      await request();
      transportStoreRegistry.getStoreApi(appKey).getState().updateTask(taskId, { status });
    },
    [transportStoreRegistry],
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
      const storeApi = transportStoreRegistry.getStoreApi(appKey);

      return storeApi.subscribe((state, previousState) => {
        const task = selectTask(taskId)(state);
        const previousTask = selectTask(taskId)(previousState);

        if (task && task !== previousTask) {
          callback(task as Task);
        }
      });
    },
    [transportStoreRegistry],
  );

  const waitForTask: ActionContextValue['waitForTask'] = useCallback(
    <TArgs = unknown, TReturn = unknown>(
      appKey: WaitForTaskAppKey,
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const cachedTask = transportStoreRegistry
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
    [subscribeToTask, transportStoreRegistry],
  );

  const reconnect = useCallback(() => {
    managerRef.current?.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect();
  }, []);

  void registryVersion;

  const tasks = getRegistryTasks(transportStoreRegistry);

  const tasksMap = useMemo(() => {
    const map = new Map<string, Task>();
    for (const [appKey, appTasks] of Object.entries(tasks)) {
      for (const [reference, task] of Object.entries(appTasks)) {
        map.set(`${appKey}:${reference}`, task);
      }
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
