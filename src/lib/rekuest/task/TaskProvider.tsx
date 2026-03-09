import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { AppKey } from '@/lib/rekuest/types';
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
  useTransportStoreApi,
  useTransportStore,
} from '@/lib/rekuest/transport/store';
import { TaskContext } from './task-context';
import { useTransport } from '@/lib/rekuest/transport/transport-context';
import type {
  AssignOptions,
  Task,
  TaskCollectionResponse,
  TaskContextValue,
  TaskStatus,
  TaskTransportMessage,
  TaskView,
  TransportMessageSubscription,
  TransportSocketConnectionState,
} from '@/lib/rekuest/transport/types';
import { TaskEventType } from '@/lib/rekuest/transport/types';
import { toast } from 'sonner';

export interface TaskProviderProps {
  children: ReactNode;
}

type AssignAppKey = Parameters<TaskContextValue['assign']>[0];
type CachedTaskAppKey = Parameters<TaskContextValue['getCachedTask']>[1];
type SubscribeAppKey = Parameters<TaskContextValue['subscribeToTask']>[1];
type WaitForTaskAppKey = Parameters<TaskContextValue['waitForTask']>[0];

const defaultConnectionState: TransportSocketConnectionState = {
  isConnected: false,
  isReconnecting: false,
  isUnconnectable: false,
  reconnectAttempt: 0,
};

function normalizeTaskView(appKey: AppKey, taskView: TaskView): Task {
  const now = new Date();

  return {
    id: taskView.assignation,
    appKey,
    action: taskView.action ?? taskView.action_key,
    args: {},
    reference: taskView.assignation,
    status: taskView.running ? 'running' : 'submitted',
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeTaskCollection(appKey: AppKey, payload: TaskCollectionResponse): Task[] {
  return Object.values(payload.tasks).map((taskView) => normalizeTaskView(appKey, taskView));
}

export function TaskProvider({ children }: TaskProviderProps) {
  const transport = useTransport();
  const taskStoreRegistry = useTaskStoreRegistry();
  const runtimeStoreApi = useTransportStoreApi();
  const subscriptionsRef = useRef(new Map<AppKey, TransportMessageSubscription>());
  const connectionSubscriptionsRef = useRef(new Map<AppKey, () => void>());
  const connectionStatesRef = useRef(new Map<AppKey, TransportSocketConnectionState>());

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
    (taskId: string, appKey: CachedTaskAppKey): Task | undefined =>
      taskStoreRegistry.getStoreApi(appKey).getState().getTask(taskId),
    [taskStoreRegistry],
  );

  const updateTaskStatus = useCallback(
    async (
      taskId: string,
      status: TaskStatus,
      request: () => Promise<void>,
      appKey: CachedTaskAppKey,
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
    (
      appKey: WaitForTaskAppKey,
      taskId: string,
    ): Promise<Task<unknown, unknown>> => {
      const cachedTask = taskStoreRegistry
        .getStoreApi(appKey)
        .getState()
        .getTask(taskId);

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

      return new Promise<Task<unknown, unknown>>((resolve, reject) => {
        const unsubscribe = subscribeToTask(taskId, appKey, (task) => {
          const typedTask = task

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

  const syncConnectionState = useCallback(() => {
    const states = Array.from(connectionStatesRef.current.values());
    const runtimeStore = runtimeStoreApi.getState();

    if (states.length === 0) {
      runtimeStore.setConnected(false);
      runtimeStore.setReconnecting(false);
      runtimeStore.setUnconnectable(false);
      runtimeStore.setReconnectAttempt(0);
      return;
    }

    runtimeStore.setConnected(states.some((state) => state.isConnected));
    runtimeStore.setReconnecting(states.some((state) => state.isReconnecting));
    runtimeStore.setUnconnectable(states.some((state) => state.isUnconnectable));
    runtimeStore.setReconnectAttempt(
      states.reduce(
        (maxAttempt, state) => Math.max(maxAttempt, state.reconnectAttempt),
        0,
      ),
    );
  }, [runtimeStoreApi]);

  const handleMessage = useCallback(
    (appKey: AppKey, message: TaskTransportMessage) => {
      const store = taskStoreRegistry.getStoreApi(appKey).getState();

      switch (message.type) {
        case TaskEventType.TASK_INIT:
          store.upsertTasks(normalizeTaskCollection(appKey, message));
          return;
        case TaskEventType.PROGRESS:
          store.updateTask(message.assignation, {
            status: 'running',
            progress: message.progress,
            progressMessage: message.message,
          });
          return;
        case TaskEventType.YIELD:
          store.updateTask(message.assignation, {
            status: 'running',
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
            status: 'completed',
            ...('returns' in message && message.returns !== undefined
              ? { result: message.returns }
              : {}),
          });
          return;
        }
        case TaskEventType.ERROR:
          store.updateTask(message.assignation, {
            status: 'failed',
            error: message.error,
          });
          return;
        case TaskEventType.CRITICAL:
          store.updateTask(message.assignation, {
            status: 'failed',
            error: message.error,
          });
          toast.error(`Critical error in task: ${message.error}`);
          return;
        case TaskEventType.PAUSED:
          store.updateTask(message.assignation, { status: 'paused' });
          return;
        case TaskEventType.RESUMED:
          store.updateTask(message.assignation, { status: 'running' });
          return;
        case TaskEventType.CANCELLED:
          store.updateTask(message.assignation, { status: 'cancelled' });
          return;
        case TaskEventType.INTERRUPTED:
          store.updateTask(message.assignation, { status: 'interrupted' });
          return;
        case TaskEventType.LOG: {
          const logMethod =
            message.level === 'ERROR' || message.level === 'CRITICAL'
              ? console.error
              : message.level === 'WARN'
                ? console.warn
                : console.log;
          logMethod(`[Agent Log] [${message.level}] ${message.message}`);
          return;
        }
      }
    },
    [taskStoreRegistry],
  );

  const goLive = useCallback(
    async (appKey: AppKey) => {
      if (!subscriptionsRef.current.has(appKey)) {
        subscriptionsRef.current.set(
          appKey,
          transport.subscribeToMessages({
            appKey,
            topic: 'tasks',
            listener: (message) => handleMessage(appKey, message),
          }),
        );
      }

      if (!connectionSubscriptionsRef.current.has(appKey)) {
        connectionSubscriptionsRef.current.set(
          appKey,
          transport.subscribeToConnectionState(appKey, (state) => {
            connectionStatesRef.current.set(appKey, state);
            syncConnectionState();
          }),
        );
      }

      if (!connectionStatesRef.current.has(appKey)) {
        connectionStatesRef.current.set(appKey, defaultConnectionState);
      }

      syncConnectionState();
    },
    [handleMessage, syncConnectionState, transport],
  );

  const stopLive = useCallback(
    async (appKey: AppKey) => {
      subscriptionsRef.current.get(appKey)?.unsubscribe();
      subscriptionsRef.current.delete(appKey);
      connectionSubscriptionsRef.current.get(appKey)?.();
      connectionSubscriptionsRef.current.delete(appKey);
      connectionStatesRef.current.delete(appKey);
      syncConnectionState();
    },
    [syncConnectionState],
  );

  const reconnect = useCallback((appKey: AppKey) => {
    transport.reconnectSocket(appKey);
  }, [transport]);

  const disconnect = useCallback((appKey: AppKey) => {
    transport.disconnectSocket(appKey);
  }, [transport]);

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
      goLive,
      stopLive,
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
      goLive,
      stopLive,
      stepTask,
      subscribeToTask,
      tasksMap,
      transport.apiEndpoint,
      transport.wsUrl,
      unpauseTask,
      waitForTask,
    ],
  );

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

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}
