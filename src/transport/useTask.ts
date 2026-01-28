// src/transport/useTask.ts

import { useState, useEffect, useCallback } from 'react';
import { useTransport } from './TransportProvider';
import type { Task, TaskStatus } from './types';

export interface UseTaskOptions {
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
  options: UseTaskOptions = {}
): UseTaskResult<TArgs, TReturn> => {
  const {
    fetchOnMount = true,
    autoSubscribe = true,
    pollingInterval,
  } = options;

  const transport = useTransport();
  const [localTask, setLocalTask] = useState<Task<TArgs, TReturn> | null>(null);

  // Get from cache first
  const cachedTask = taskId
    ? transport.getCachedTask<TArgs, TReturn>(taskId)
    : undefined;

  const task = localTask ?? cachedTask ?? null;

  // Derived state
  const status = task?.status ?? null;
  const result = (task?.result as TReturn) ?? null;
  const error = task?.error ?? null;
  const progress = task?.progress ?? null;
  const isLoading = status === 'pending' || status === 'running';

  // Fetch task from server
  const refresh = useCallback(async (): Promise<void> => {
    if (!taskId) return;
    const fetched = await transport.getTask<TArgs, TReturn>(taskId);
    setLocalTask(fetched);
  }, [taskId, transport]);

  // Cancel task
  const cancel = useCallback(async (): Promise<void> => {
    if (!taskId) return;
    await transport.cancelTask(taskId);
  }, [taskId, transport]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount && taskId && !cachedTask) {
      refresh();
    }
  }, [fetchOnMount, taskId, cachedTask, refresh]);

  // Subscribe to updates
  useEffect(() => {
    if (!autoSubscribe || !taskId) return;

    const unsubscribe = transport.subscribeToTask(taskId, (updated) => {
      setLocalTask(updated as Task<TArgs, TReturn>);
    });

    return unsubscribe;
  }, [autoSubscribe, taskId, transport]);

  // Polling fallback when disconnected
  useEffect(() => {
    if (!pollingInterval || !taskId || transport.isConnected) return;
    if (status === 'completed' || status === 'failed' || status === 'cancelled') return;

    const interval = setInterval(refresh, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval, taskId, transport.isConnected, status, refresh]);

  return {
    task,
    status,
    result,
    error,
    progress,
    isLoading,
    isConnected: transport.isConnected,
    refresh,
    cancel,
  };
};

export default useTask;
