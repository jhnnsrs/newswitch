// src/store/transportStore.ts
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
    action: string,
    reference: string,
    args: TArgs,
    status?: TaskStatus,
  ) => Task<TArgs, TReturn>;

  /** Explicitly attach the server's task ID to a local reference after assignment */
  setAssignationID: (reference: string, assignationId: string) => void;

  updateTask: (referenceOrId: string, updates: Partial<Task>) => void;

  getTask: <TArgs = unknown, TReturn = unknown>(
    referenceOrId: string,
  ) => Task<TArgs, TReturn> | undefined;

  removeTask: (referenceOrId: string) => void;

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
        action: string,
        reference: string,
        args: TArgs,
        status: TaskStatus = "pending",
      ): Task<TArgs, TReturn> => {
        const now = new Date();
        const task: Task<TArgs, TReturn> = {
          id: reference, // Use reference as a placeholder ID until setAssignationID is called
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
          if (task) {
            task.id = assignationId;
            task.updatedAt = new Date();
            state.taskIdToReference[assignationId] = reference;

            // RACE CONDITION FIX: Flush any pending WebSocket updates
            // that arrived before this HTTP response resolved.
            const pendingUpdates = state.pendingTaskUpdates[assignationId];
            if (pendingUpdates && pendingUpdates.length > 0) {
              pendingUpdates.forEach((update) => {
                Object.assign(task, update, { updatedAt: new Date() });
              });
              // Clean up the cache once applied
              delete state.pendingTaskUpdates[assignationId];
            }
          }
        });
      },

      updateTask: (referenceOrId, updates) => {
        set((state) => {
          const ref = state.tasks[referenceOrId]
            ? referenceOrId
            : state.taskIdToReference[referenceOrId];

          // If the task doesn't exist yet, it's likely a WebSocket update outrunning the HTTP response.
          // Cache it based on the ID provided (which will be the server's assignation ID).
          if (!ref) {
            if (!state.pendingTaskUpdates[referenceOrId]) {
              state.pendingTaskUpdates[referenceOrId] = [];
            }
            state.pendingTaskUpdates[referenceOrId].push(updates);
            return;
          }

          // Otherwise, apply the update normally
          const task = state.tasks[ref];
          Object.assign(task, updates, { updatedAt: new Date() });

          // Catch any spontaneous ID updates that bypass setAssignationID
          if (updates.id && updates.id !== ref) {
            state.taskIdToReference[updates.id] = ref;
          }
        });
      },

      getTask: <TArgs = unknown, TReturn = unknown>(
        referenceOrId: string,
      ): Task<TArgs, TReturn> | undefined => {
        const state = get();
        const ref = state.tasks[referenceOrId]
          ? referenceOrId
          : state.taskIdToReference[referenceOrId];

        return ref ? (state.tasks[ref] as Task<TArgs, TReturn>) : undefined;
      },

      removeTask: (referenceOrId) => {
        set((state) => {
          const ref = state.tasks[referenceOrId]
            ? referenceOrId
            : state.taskIdToReference[referenceOrId];

          if (!ref) {
            // Also clear any orphaned updates if the task is removed before it's even fully created
            if (state.pendingTaskUpdates[referenceOrId]) {
              delete state.pendingTaskUpdates[referenceOrId];
            }
            return;
          }

          const task = state.tasks[ref];

          if (task.id && state.taskIdToReference[task.id]) {
            delete state.taskIdToReference[task.id];
          }
          if (task.id && state.pendingTaskUpdates[task.id]) {
            delete state.pendingTaskUpdates[task.id];
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
  <TArgs = unknown, TReturn = unknown>(referenceOrId: string) =>
  (store: TransportStore) => {
    const ref = store.tasks[referenceOrId]
      ? referenceOrId
      : store.taskIdToReference[referenceOrId];
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
