import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { TransportStore as RuntimeTransportStore } from '@/lib/rekuest/transport/store';
import type { Task, TaskStatus } from '@/lib/rekuest/transport/types';

const resolveTaskReference = (
  state: Pick<TaskStore, 'tasks' | 'taskIdToReference'>,
  referenceOrId: string,
) => {
  if (state.tasks[referenceOrId]) {
    return referenceOrId;
  }

  return state.taskIdToReference[referenceOrId];
};

export interface TaskStore {
  tasks: Record<string, Task>;
  taskIdToReference: Record<string, string>;
  pendingTaskUpdates: Record<string, Partial<Task>[]>;
  addTask: <TArgs = unknown, TReturn = unknown>(
    action: string,
    reference: string,
    args: TArgs,
    status?: TaskStatus,
  ) => Task<TArgs, TReturn>;
  setAssignationID: (reference: string, assignationId: string) => void;
  updateTask: (referenceOrId: string, updates: Partial<Task>) => void;
  getTask: <TArgs = unknown, TReturn = unknown>(
    referenceOrId: string,
  ) => Task<TArgs, TReturn> | undefined;
  removeTask: (referenceOrId: string) => void;
  clearTasks: () => void;
}

export const createTaskStore = () =>
  createStore<TaskStore>()(
    subscribeWithSelector(
      immer((set, get) => ({
        tasks: {},
        taskIdToReference: {},
        pendingTaskUpdates: {},
        addTask: <TArgs = unknown, TReturn = unknown>(
          action: string,
          reference: string,
          args: TArgs,
          status: TaskStatus = 'pending',
        ): Task<TArgs, TReturn> => {
          const now = new Date();
          const task: Task<TArgs, TReturn> = {
            id: reference,
            action,
            args,
            status,
            reference,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => {
            state.tasks[reference] = task as Task;
          });

          return task;
        },
        setAssignationID: (reference, assignationId) => {
          set((state) => {
            const task = state.tasks[reference];
            if (!task) {
              return;
            }

            task.id = assignationId;
            task.updatedAt = new Date();

            state.taskIdToReference[assignationId] = reference;

            const pendingUpdates = state.pendingTaskUpdates[assignationId];
            if (pendingUpdates && pendingUpdates.length > 0) {
              pendingUpdates.forEach((update) => {
                Object.assign(task, update, { updatedAt: new Date() });
              });
              delete state.pendingTaskUpdates[assignationId];
            }
          });
        },
        updateTask: (referenceOrId, updates) => {
          set((state) => {
            const reference = resolveTaskReference(state, referenceOrId);

            if (!reference) {
              if (!state.pendingTaskUpdates[referenceOrId]) {
                state.pendingTaskUpdates[referenceOrId] = [];
              }
              state.pendingTaskUpdates[referenceOrId].push(updates);
              return;
            }

            const task = state.tasks[reference];
            if (!task) {
              return;
            }

            Object.assign(task, updates, { updatedAt: new Date() });

            if (updates.id && updates.id !== reference) {
              state.taskIdToReference[updates.id] = reference;
            }
          });
        },
        getTask: <TArgs = unknown, TReturn = unknown>(referenceOrId: string) => {
          const state = get();
          const reference = resolveTaskReference(state, referenceOrId);
          if (!reference) {
            return undefined;
          }

          return state.tasks[reference] as
            | Task<TArgs, TReturn>
            | undefined;
        },
        removeTask: (referenceOrId) => {
          set((state) => {
            const reference = resolveTaskReference(state, referenceOrId);
            if (!reference) {
              delete state.pendingTaskUpdates[referenceOrId];
              return;
            }

            const task = state.tasks[reference];
            if (!task) {
              return;
            }

            if (task.id) {
              delete state.taskIdToReference[task.id];
              delete state.pendingTaskUpdates[task.id];
            }

            delete state.tasks[reference];
          });
        },
        clearTasks: () => {
          set((state) => {
            state.tasks = {};
            state.taskIdToReference = {};
            state.pendingTaskUpdates = {};
          });
        },
      })),
    ),
  );

export interface TaskStoreRegistry {
  defaultAppKey: string;
  getStoreApi: (appKey?: string) => StoreApi<TaskStore>;
  getStoreEntries: () => Array<[string, StoreApi<TaskStore>]>;
}

export type TransportStore = TaskStore & RuntimeTransportStore;
export type TransportStoreRegistry = TaskStoreRegistry;

export const createTaskStoreRegistry = (
  transportStore: StoreApi<RuntimeTransportStore>,
): TaskStoreRegistry => {
  const stores = new Map<string, StoreApi<TaskStore>>();

  const getStoreApi = (appKey: string) => {
    const existingStore = stores.get(appKey);
    if (existingStore) {
      return existingStore;
    }

    const nextStore = createTaskStore();
    nextStore.subscribe(() => {
      transportStore.getState().bumpRegistryVersion();
    });
    stores.set(appKey, nextStore);
    return nextStore;
  };

  return {
    getStoreApi,
    getStoreEntries: () => Array.from(stores.entries()),
  };
};

export const TaskStoreContext = createContext<TaskStoreRegistry | null>(null);

export const useTaskStoreRegistry = (): TaskStoreRegistry => {
  const registry = useContext(TaskStoreContext);

  if (!registry) {
    throw new Error('Missing TaskStoreProvider');
  }

  return registry;
};

export function useTaskStoreApi(appKey: string) {
  return useTaskStoreRegistry().getStoreApi(appKey);
}

export function useTaskStore<TSelected>(
  selector: (state: TaskStore) => TSelected,
): TSelected;
export function useTaskStore<TSelected>(
  appKey: string,
  selector: (state: TaskStore) => TSelected,
): TSelected;
export function useTaskStore<TSelected>(
  appKeyOrSelector: string | ((state: TaskStore) => TSelected),
  maybeSelector?: (state: TaskStore) => TSelected,
): TSelected {
  const registry = useTaskStoreRegistry();
  const appKey = typeof appKeyOrSelector === 'string'
    ? appKeyOrSelector
    : registry.defaultAppKey;
  const selector = typeof appKeyOrSelector === 'string'
    ? maybeSelector
    : appKeyOrSelector;

  if (!selector) {
    throw new Error('Missing task selector');
  }

  return useStore(registry.getStoreApi(appKey), selector);
}

export const getRegistryTasks = (registry: TaskStoreRegistry) =>
  Object.fromEntries(
    registry.getStoreEntries().map(([appKey, storeApi]) => [appKey, storeApi.getState().tasks]),
  ) as Record<string, Record<string, Task>>;

export const selectTask =
  <TArgs = unknown, TReturn = unknown>(referenceOrId: string) =>
  (store: TaskStore) => {
    const reference = resolveTaskReference(store, referenceOrId);
    if (!reference) {
      return undefined;
    }

    return store.tasks[reference] as
      | Task<TArgs, TReturn>
      | undefined;
  };

export const selectTasks = (store: TaskStore) => Object.values(store.tasks);
export const selectTasksByAction =
  (actionName: string) => (store: TaskStore) =>
    Object.values(store.tasks).filter((task) => task.action === actionName);

export const taskStore = {
  getState: () => {
    throw new Error(
      'taskStore.getState is no longer available outside StoreProvider context.',
    );
  },
  subscribe: () => {
    throw new Error(
      'taskStore.subscribe is no longer available outside StoreProvider context.',
    );
  },
};
