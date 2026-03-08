import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Task, TaskStatus } from '@/transport/types';

const resolveTaskReference = (
  state: Pick<TransportStore, 'tasks' | 'taskIdToReference'>,
  referenceOrId: string,
) => {
  if (state.tasks[referenceOrId]) {
    return referenceOrId;
  }

  return state.taskIdToReference[referenceOrId];
};

export interface TransportStore {
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

export interface TransportRuntimeStore {
  isConnected: boolean;
  isReconnecting: boolean;
  isUnconnectable: boolean;
  reconnectAttempt: number;
  registryVersion: number;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setUnconnectable: (unconnectable: boolean) => void;
  setReconnectAttempt: (attempt: number) => void;
  incrementReconnectAttempt: () => number;
  resetReconnect: () => void;
  bumpRegistryVersion: () => void;
}

export const createTransportStore = () =>
  createStore<TransportStore>()(
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

export const createTransportRuntimeStore = () =>
  createStore<TransportRuntimeStore>()(
    subscribeWithSelector(
      immer((set) => ({
        isConnected: false,
        isReconnecting: false,
        isUnconnectable: false,
        reconnectAttempt: 0,
        registryVersion: 0,
        setConnected: (connected) => {
          set((state) => {
            state.isConnected = connected;
            if (connected) {
              state.isUnconnectable = false;
            }
          });
        },
        setReconnecting: (reconnecting) => {
          set((state) => {
            state.isReconnecting = reconnecting;
          });
        },
        setUnconnectable: (unconnectable) => {
          set((state) => {
            state.isUnconnectable = unconnectable;
            if (unconnectable) {
              state.isReconnecting = false;
            }
          });
        },
        setReconnectAttempt: (attempt) => {
          set((state) => {
            state.reconnectAttempt = attempt;
          });
        },
        incrementReconnectAttempt: () => {
          let nextAttempt = 0;
          set((state) => {
            nextAttempt = state.reconnectAttempt + 1;
            state.reconnectAttempt = nextAttempt;
          });
          return nextAttempt;
        },
        resetReconnect: () => {
          set((state) => {
            state.reconnectAttempt = 0;
            state.isReconnecting = false;
            state.isUnconnectable = false;
          });
        },
        bumpRegistryVersion: () => {
          set((state) => {
            state.registryVersion += 1;
          });
        },
      })),
    ),
  );

export interface TransportStoreRegistry {
  defaultAppKey: string;
  runtimeStore: StoreApi<TransportRuntimeStore>;
  getStoreApi: (appKey?: string) => StoreApi<TransportStore>;
  getStoreEntries: () => Array<[string, StoreApi<TransportStore>]>;
}

export const createTransportStoreRegistry = (
  defaultAppKey: string,
): TransportStoreRegistry => {
  const runtimeStore = createTransportRuntimeStore();
  const stores = new Map<string, StoreApi<TransportStore>>();

  const getStoreApi = (appKey = defaultAppKey) => {
    const existingStore = stores.get(appKey);
    if (existingStore) {
      return existingStore;
    }

    const nextStore = createTransportStore();
    nextStore.subscribe(() => {
      runtimeStore.getState().bumpRegistryVersion();
    });
    stores.set(appKey, nextStore);
    return nextStore;
  };

  return {
    defaultAppKey,
    runtimeStore,
    getStoreApi,
    getStoreEntries: () => Array.from(stores.entries()),
  };
};

export const TransportStoreContext = createContext<TransportStoreRegistry | null>(null);

export const useTransportStoreRegistry = (): TransportStoreRegistry => {
  const registry = useContext(TransportStoreContext);

  if (!registry) {
    throw new Error('Missing TransportStoreProvider');
  }

  return registry;
};

export function useTransportStoreApi(appKey?: string) {
  return useTransportStoreRegistry().getStoreApi(appKey);
}

export function useTransportRuntimeStoreApi() {
  return useTransportStoreRegistry().runtimeStore;
}

export function useTransportStore<TSelected>(
  selector: (state: TransportStore) => TSelected,
): TSelected;
export function useTransportStore<TSelected>(
  appKey: string,
  selector: (state: TransportStore) => TSelected,
): TSelected;
export function useTransportStore<TSelected>(
  appKeyOrSelector: string | ((state: TransportStore) => TSelected),
  maybeSelector?: (state: TransportStore) => TSelected,
): TSelected {
  const registry = useTransportStoreRegistry();
  const appKey = typeof appKeyOrSelector === 'string'
    ? appKeyOrSelector
    : registry.defaultAppKey;
  const selector = typeof appKeyOrSelector === 'string'
    ? maybeSelector
    : appKeyOrSelector;

  if (!selector) {
    throw new Error('Missing transport selector');
  }

  return useStore(registry.getStoreApi(appKey), selector);
}

export function useTransportRuntimeStore<TSelected>(
  selector: (state: TransportRuntimeStore) => TSelected,
): TSelected {
  const registry = useTransportStoreRegistry();
  return useStore(registry.runtimeStore, selector);
}

export const getRegistryTasks = (registry: TransportStoreRegistry) =>
  Object.fromEntries(
    registry.getStoreEntries().map(([appKey, storeApi]) => [appKey, storeApi.getState().tasks]),
  ) as Record<string, Record<string, Task>>;

export const selectTask =
  <TArgs = unknown, TReturn = unknown>(referenceOrId: string) =>
  (store: TransportStore) => {
    const reference = resolveTaskReference(store, referenceOrId);
    if (!reference) {
      return undefined;
    }

    return store.tasks[reference] as
      | Task<TArgs, TReturn>
      | undefined;
  };

export const selectTasks = (store: TransportStore) => Object.values(store.tasks);
export const selectTasksByAction =
  (actionName: string) => (store: TransportStore) =>
    Object.values(store.tasks).filter((task) => task.action === actionName);

export const selectIsConnected = (store: TransportRuntimeStore) => store.isConnected;
export const selectIsReconnecting = (store: TransportRuntimeStore) => store.isReconnecting;
export const selectIsUnconnectable = (store: TransportRuntimeStore) => store.isUnconnectable;
export const selectReconnectAttempt = (store: TransportRuntimeStore) => store.reconnectAttempt;
export const selectRegistryVersion = (store: TransportRuntimeStore) => store.registryVersion;

export const transportStore = {
  getState: () => {
    throw new Error(
      'transportStore.getState is no longer available outside StoreProvider context.',
    );
  },
  subscribe: () => {
    throw new Error(
      'transportStore.subscribe is no longer available outside StoreProvider context.',
    );
  },
};
