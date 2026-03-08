// src/transport/useTask.ts

import { defaultAppKey } from "@/apps";
import { useCallback, useEffect, useMemo } from "react";
import { selectTask, useTransportStore } from "@/lib/rekuest/task/store";
import { useAction } from "./action-context";
import type { Task, TaskStatus } from "./types";

export interface UseTaskOptions {
  appKey?: string;
  /** Whether to fetch from server on mount */
  fetchOnMount?: boolean;
  /** Whether to auto-subscribe to updates */
  autoSubscribe?: boolean;
  /** Polling interval in ms (if WebSocket is disconnected) */
  pollingInterval?: number;
}

export interface UseTaskResult<TArgs = unknown, TReturn = unknown> {
  task: Task<TArgs, TReturn> | null;
  status: TaskStatus | null;
  result: TReturn | null;
  error: string | null;
  progress: number | null;
  isLoading: boolean;
  isConnected: boolean;
  refresh: () => Promise<void>;
  cancel: () => Promise<void>;
}

/**
 * Hook to subscribe to a specific task by ID
 */
export const useTask = <TArgs = unknown, TReturn = unknown>(
  taskId: string | null,
  options: UseTaskOptions = {},
): UseTaskResult<TArgs, TReturn> => {
  const {
    appKey = defaultAppKey,
    fetchOnMount = true,
    pollingInterval,
  } = options;

  void options.autoSubscribe;

  const action = useAction();
  const scopedAppKey = appKey as Parameters<typeof action.getTask>[0];
  const taskSelector = useMemo(
    () => (taskId ? selectTask<TArgs, TReturn>(taskId) : () => undefined),
    [taskId],
  );
  const task = useTransportStore(appKey, taskSelector) ?? null;

  // Derived state
  const status = task?.status ?? null;
  const result = (task?.result as TReturn) ?? null;
  const error = task?.error ?? null;
  const progress = task?.progress ?? null;
  const isLoading = status === "pending" || status === "running";

  // Fetch task from server
  const refresh = useCallback(async (): Promise<void> => {
    if (!taskId) return;
    await action.getTask<TArgs, TReturn>(scopedAppKey, taskId);
  }, [action, scopedAppKey, taskId]);

  // Cancel task
  const cancel = useCallback(async (): Promise<void> => {
    if (!taskId) return;
    await action.cancelTask(scopedAppKey, taskId);
  }, [action, scopedAppKey, taskId]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount && taskId && !task) {
      queueMicrotask(() => {
        void refresh();
      });
    }
  }, [fetchOnMount, refresh, task, taskId]);

  // Polling fallback when disconnected
  useEffect(() => {
    if (!pollingInterval || !taskId || action.isConnected) return;
    if (status === "completed" || status === "failed" || status === "cancelled")
      return;

    const interval = setInterval(refresh, pollingInterval);
    return () => clearInterval(interval);
  }, [action.isConnected, pollingInterval, refresh, status, taskId]);

  return {
    task,
    status,
    result,
    error,
    progress,
    isLoading,
    isConnected: action.isConnected,
    refresh,
    cancel,
  };
};

export default useTask;
