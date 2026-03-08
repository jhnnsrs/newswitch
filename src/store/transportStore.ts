// src/store/transportStore.ts
import type { AppKey } from "@/apps";
import { getScopedTaskId, getScopedTaskReference } from "@/lib/rekuest/task";
import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Task, TaskStatus } from "../transport/types";
import { createScopedStoreHooks } from "./createScopedStore";

export interface TransportStore {
  /** Connection state */
  isConnected: boolean;
  isReconnecting: boolean;
  isUnconnectable: boolean;
  reconnectAttempt: number;

  /** Tasks dictionary, strictly keyed by local 'reference' */
  tasks: Record<string, Task>;

  /** Secondary map to resolve server-provided task IDs back to their local reference */
  taskIdToReference: Record<string, string>;

  /** * Cache for WebSocket updates that arrive before the HTTP POST resolves.
   * Keyed by the server's assignation ID.
   */
  pendingTaskUpdates: Record<string, Partial<Task>[]>;

  // Connection actions
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setUnconnectable: (unconnectable: boolean) => void;
  setReconnectAttempt: (attempt: number) => void;
  incrementReconnectAttempt: () => number;
  resetReconnect: () => void;

  // Task actions
  addTask: <TArgs = unknown, TReturn = unknown>(
    appKey: AppKey,
    action: string,
    reference: string,
    args: TArgs,
    status?: TaskStatus,
  ) => Task<TArgs, TReturn>;

  /** Explicitly attach the server's task ID to a local reference after assignment */
  setAssignationID: (
    appKey: AppKey,
    reference: string,
    assignationId: string,
  ) => void;

  updateTask: (
    referenceOrId: string,
    updates: Partial<Task>,
    appKey?: AppKey,
  ) => void;

  getTask: <TArgs = unknown, TReturn = unknown>(
    referenceOrId: string,
    appKey?: AppKey,
  ) => Task<TArgs, TReturn> | undefined;

  removeTask: (referenceOrId: string, appKey?: AppKey) => void;

  clearTasks: () => void;
}

export const createTransportStore = () =>
  createStore<TransportStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      isConnected: false,
      isReconnecting: false,
      isUnconnectable: false,
      reconnectAttempt: 0,

      tasks: {},
      taskIdToReference: {},
      pendingTaskUpdates: {},

      // Connection actions
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

      // Task actions
      addTask: <TArgs = unknown, TReturn = unknown>(
        appKey: AppKey,
        action: string,
        reference: string,
        args: TArgs,
        status: TaskStatus = "pending",
      ): Task<TArgs, TReturn> => {
        const now = new Date();
        const scopedReference = getScopedTaskReference(appKey, reference);
        const task: Task<TArgs, TReturn> = {
          id: scopedReference,
          appKey,
          action,
          args,
          status,
          reference: scopedReference,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          state.tasks[scopedReference] = task as Task;
        });

        return task;
      },

      setAssignationID: (appKey, reference, assignationId) => {
        set((state) => {
          const scopedReference = getScopedTaskReference(appKey, reference);
          const scopedAssignationId = getScopedTaskId(appKey, assignationId);
          const task = state.tasks[scopedReference];
          if (task) {
            task.id = assignationId;
            task.updatedAt = new Date();
            state.taskIdToReference[scopedAssignationId] = scopedReference;

            // RACE CONDITION FIX: Flush any pending WebSocket updates
            // that arrived before this HTTP response resolved.
            const pendingUpdates = state.pendingTaskUpdates[scopedAssignationId];
            if (pendingUpdates && pendingUpdates.length > 0) {
              pendingUpdates.forEach((update) => {
                Object.assign(task, update, { updatedAt: new Date() });
              });
              // Clean up the cache once applied
              delete state.pendingTaskUpdates[scopedAssignationId];
            }
          }
        });
      },

      updateTask: (referenceOrId, updates, appKey) => {
        set((state) => {
          const scopedReferenceOrId = appKey
            ? getScopedTaskReference(appKey, referenceOrId)
            : referenceOrId;
          const scopedId = appKey ? getScopedTaskId(appKey, referenceOrId) : referenceOrId;
          const ref = state.tasks[referenceOrId]
            ? referenceOrId
            : state.tasks[scopedReferenceOrId]
              ? scopedReferenceOrId
            : state.taskIdToReference[referenceOrId];
          const resolvedReference = ref ?? state.taskIdToReference[scopedId];

          // If the task doesn't exist yet, it's likely a WebSocket update outrunning the HTTP response.
          // Cache it based on the ID provided (which will be the server's assignation ID).
          if (!resolvedReference) {
            const pendingKey = appKey ? scopedId : referenceOrId;
            if (!state.pendingTaskUpdates[pendingKey]) {
              state.pendingTaskUpdates[pendingKey] = [];
            }
            state.pendingTaskUpdates[pendingKey].push(updates);
            return;
          }

          // Otherwise, apply the update normally
          const task = state.tasks[resolvedReference];
          Object.assign(task, updates, { updatedAt: new Date() });

          // Catch any spontaneous ID updates that bypass setAssignationID
          if (updates.id && updates.id !== resolvedReference && task.appKey) {
            state.taskIdToReference[getScopedTaskId(task.appKey, updates.id)] =
              resolvedReference;
          }
        });
      },

      getTask: <TArgs = unknown, TReturn = unknown>(
        referenceOrId: string,
        appKey?: AppKey,
      ): Task<TArgs, TReturn> | undefined => {
        const state = get();
        const scopedReference = appKey
          ? getScopedTaskReference(appKey, referenceOrId)
          : referenceOrId;
        const scopedId = appKey ? getScopedTaskId(appKey, referenceOrId) : referenceOrId;
        const ref = state.tasks[referenceOrId]
          ? referenceOrId
          : state.tasks[scopedReference]
            ? scopedReference
            : state.taskIdToReference[referenceOrId] ?? state.taskIdToReference[scopedId];

        return ref ? (state.tasks[ref] as Task<TArgs, TReturn>) : undefined;
      },

      removeTask: (referenceOrId, appKey) => {
        set((state) => {
          const scopedReference = appKey
            ? getScopedTaskReference(appKey, referenceOrId)
            : referenceOrId;
          const scopedId = appKey ? getScopedTaskId(appKey, referenceOrId) : referenceOrId;
          const ref = state.tasks[referenceOrId]
            ? referenceOrId
            : state.tasks[scopedReference]
              ? scopedReference
              : state.taskIdToReference[referenceOrId] ?? state.taskIdToReference[scopedId];

          if (!ref) {
            // Also clear any orphaned updates if the task is removed before it's even fully created
            if (state.pendingTaskUpdates[scopedId]) {
              delete state.pendingTaskUpdates[scopedId];
            }
            return;
          }

          const task = state.tasks[ref];

          if (task.id && state.taskIdToReference[task.id]) {
            delete state.taskIdToReference[task.id];
          }
          if (task.id && task.appKey) {
            const pendingKey = getScopedTaskId(task.appKey, task.id);
            delete state.taskIdToReference[pendingKey];
            if (state.pendingTaskUpdates[pendingKey]) {
              delete state.pendingTaskUpdates[pendingKey];
            }
          }

          delete state.tasks[ref];
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

const {
  StoreContext: TransportStoreContext,
  useScopedStore: useTransportStore,
  useStoreApi: useTransportStoreApi,
} = createScopedStoreHooks<
  TransportStore,
  ReturnType<typeof createTransportStore>
>("TransportStore");

export { TransportStoreContext, useTransportStore, useTransportStoreApi };

// Selectors
export const selectTask =
  <TArgs = unknown, TReturn = unknown>(referenceOrId: string, appKey?: AppKey) =>
  (store: TransportStore) => {
    const scopedReference = appKey
      ? getScopedTaskReference(appKey, referenceOrId)
      : referenceOrId;
    const scopedId = appKey ? getScopedTaskId(appKey, referenceOrId) : referenceOrId;
    const ref = store.tasks[referenceOrId]
      ? referenceOrId
      : store.tasks[scopedReference]
        ? scopedReference
        : store.taskIdToReference[referenceOrId] ?? store.taskIdToReference[scopedId];
    return ref ? (store.tasks[ref] as Task<TArgs, TReturn>) : undefined;
  };

export const selectTasks = (store: TransportStore) => store.tasks;

export const selectTasksByAction =
  (actionName: string) => (store: TransportStore) =>
    Object.values(store.tasks).filter((task) => task.action === actionName);

export const selectIsConnected = (store: TransportStore) => store.isConnected;
export const selectIsReconnecting = (store: TransportStore) =>
  store.isReconnecting;
export const selectIsUnconnectable = (store: TransportStore) =>
  store.isUnconnectable;
export const selectReconnectAttempt = (store: TransportStore) =>
  store.reconnectAttempt;

// Convenience hook for accessing the store outside of React
export const transportStore = {
  getState: () => {
    throw new Error(
      "transportStore.getState is no longer available outside StoreProvider context.",
    );
  },
  subscribe: () => {
    throw new Error(
      "transportStore.subscribe is no longer available outside StoreProvider context.",
    );
  },
};
