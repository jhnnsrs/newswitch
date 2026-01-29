// src/store/transportStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Task, TaskStatus } from '../transport/types';

export interface TransportStore {
  /** Connection state */
  isConnected: boolean;
  isReconnecting: boolean;
  isUnconnectable: boolean;
  reconnectAttempt: number;

  /** Tasks by ID */
  tasks: Record<string, Task>;

  /** Task subscribers (for compatibility with callback-based subscriptions) */
  taskSubscribers: Record<string, Set<(task: Task) => void>>;

  // Connection actions
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setUnconnectable: (unconnectable: boolean) => void;
  setReconnectAttempt: (attempt: number) => void;
  incrementReconnectAttempt: () => number;
  resetReconnect: () => void;

  // Task actions
  addTask: <TArgs = unknown, TReturn = unknown>(
    taskId: string,
    action: string,
    args: TArgs,
    status?: TaskStatus,
    notify?: boolean
  ) => Task<TArgs, TReturn>;
  
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  
  getTask: <TArgs = unknown, TReturn = unknown>(
    taskId: string
  ) => Task<TArgs, TReturn> | undefined;
  
  removeTask: (taskId: string) => void;
  
  clearTasks: () => void;

  // Subscription actions (for callback-based subscriptions)
  subscribeToTask: (
    taskId: string,
    callback: (task: Task) => void
  ) => () => void;
  
  notifyTaskSubscribers: (taskId: string, task: Task) => void;
}

export const useTransportStore = create<TransportStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      isConnected: false,
      isReconnecting: false,
      isUnconnectable: false,
      reconnectAttempt: 0,
      tasks: {},
      taskSubscribers: {},

      // Connection actions
      setConnected: (connected) => {
        set((state) => {
          state.isConnected = connected;
          // Reset unconnectable when successfully connected
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
        taskId: string,
        action: string,
        args: TArgs,
        status: TaskStatus = 'pending',
        notify?: boolean
      ): Task<TArgs, TReturn> => {
        const now = new Date();
        const task: Task<TArgs, TReturn> = {
          id: taskId,
          action,
          args,
          status,
          notify,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          state.tasks[taskId] = task as Task;
        });

        return task;
      },

      updateTask: (taskId, updates) => {
        const currentTask = get().tasks[taskId];
        if (!currentTask) return;

        set((state) => {
          const task = state.tasks[taskId];
          if (task) {
            Object.assign(task, updates, { updatedAt: new Date() });
          }
        });

        // Notify subscribers after update
        const updatedTask = get().tasks[taskId];
        if (updatedTask) {
          get().notifyTaskSubscribers(taskId, updatedTask);
        }
      },

      getTask: <TArgs = unknown, TReturn = unknown>(
        taskId: string
      ): Task<TArgs, TReturn> | undefined => {
        return get().tasks[taskId] as Task<TArgs, TReturn> | undefined;
      },

      removeTask: (taskId) => {
        set((state) => {
          delete state.tasks[taskId];
          delete state.taskSubscribers[taskId];
        });
      },

      clearTasks: () => {
        set((state) => {
          state.tasks = {};
          state.taskSubscribers = {};
        });
      },

      // Subscription actions
      subscribeToTask: (taskId, callback) => {
        // Add subscriber
        set((state) => {
          if (!state.taskSubscribers[taskId]) {
            state.taskSubscribers[taskId] = new Set();
          }
          state.taskSubscribers[taskId].add(callback);
        });

        // Return unsubscribe function
        return () => {
          set((state) => {
            const subs = state.taskSubscribers[taskId];
            if (subs) {
              subs.delete(callback);
              if (subs.size === 0) {
                delete state.taskSubscribers[taskId];
              }
            }
          });
        };
      },

      notifyTaskSubscribers: (taskId, task) => {
        const subs = get().taskSubscribers[taskId];
        if (subs) {
          subs.forEach((callback) => callback(task));
        }
      },
    }))
  )
);

// Selectors
export const selectTask = <TArgs = unknown, TReturn = unknown>(taskId: string) =>
  (store: TransportStore) => store.tasks[taskId] as Task<TArgs, TReturn> | undefined;

export const selectTasks = (store: TransportStore) => store.tasks;

export const selectTasksByAction = (actionName: string) =>
  (store: TransportStore) => 
    Object.values(store.tasks).filter((task) => task.action === actionName);

export const selectIsConnected = (store: TransportStore) => store.isConnected;
export const selectIsReconnecting = (store: TransportStore) => store.isReconnecting;
export const selectIsUnconnectable = (store: TransportStore) => store.isUnconnectable;
export const selectReconnectAttempt = (store: TransportStore) => store.reconnectAttempt;

// Convenience hook for accessing the store outside of React
export const transportStore = {
  get getState() {
    return useTransportStore.getState;
  },
  get subscribe() {
    return useTransportStore.subscribe;
  },
};
