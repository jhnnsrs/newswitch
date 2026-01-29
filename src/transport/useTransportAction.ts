// src/transport/useTransportAction.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z, ZodType } from 'zod';
import { useTransport } from './TransportProvider';
import { useTransportStore, selectTask } from '../store';
import type { Task, TaskStatus, AssignOptions } from './types';

export interface ActionDefinition<TArgs, TReturn> {
  name: string;
  description?: string;
  argsSchema: ZodType<TArgs>;
  returnSchema?: ZodType<TReturn>;
}

export interface UseTransportActionOptions {
  /** Whether to automatically subscribe to task updates */
  autoSubscribe?: boolean;
  /** Callback when task status changes */
  onStatusChange?: (status: TaskStatus, task: Task) => void;
  /** Callback when task completes */
  onComplete?: <TReturn>(result: TReturn, task: Task) => void;
  /** Callback when task fails */
  onError?: (error: string, task: Task) => void;
  /** Callback for progress updates */
  onProgress?: (progress: number, task: Task) => void;
}

export interface UseTransportActionResult<TArgs, TReturn> {
  /** Assign (execute) the action with given args */
  assign: (args: TArgs, options?: AssignOptions) => Promise<Task<TArgs, TReturn>>;
  /** Current task (most recently assigned) */
  task: Task<TArgs, TReturn> | null;
  /** All tasks for this action */
  tasks: Task<TArgs, TReturn>[];
  /** Current task status */
  status: TaskStatus | null;
  /** Current task result */
  result: TReturn | null;
  /** Current task error */
  error: string | null;
  /** Current task progress (0-100) */
  progress: number | null;
  /** Whether any task is loading (pending/running) */
  isLoading: boolean;
  /** Validation error from args schema */
  validationError: z.ZodError | null;
  /** Refresh task state from server */
  refresh: () => Promise<void>;
  /** Cancel the current task */
  cancel: () => Promise<void>;
  /** Clear current task reference */
  clear: () => void;
}

// Stable selector for when there's no task
const noTaskSelector = () => undefined;

export const useTransportAction = <TArgs, TReturn>(
  definition: ActionDefinition<TArgs, TReturn>,
  options: UseTransportActionOptions = {}
): UseTransportActionResult<TArgs, TReturn> => {
  const {
    autoSubscribe = true,
    onStatusChange,
    onComplete,
    onError,
    onProgress,
  } = options;

  const transport = useTransport();
  
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [allTaskIds, setAllTaskIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<z.ZodError | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const callbacksRef = useRef({ onStatusChange, onComplete, onError, onProgress });
  
  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = { onStatusChange, onComplete, onError, onProgress };
  }, [onStatusChange, onComplete, onError, onProgress]);

  // Subscribe to current task from Zustand store with stable selector
  const taskSelector = useMemo(
    () => currentTaskId ? selectTask<TArgs, TReturn>(currentTaskId) : noTaskSelector,
    [currentTaskId]
  );
  const task = useTransportStore(taskSelector) ?? null;

  // Get all tasks for this action from Zustand store
  const allTasks = useTransportStore((store) => store.tasks);
  const tasks = allTaskIds
    .map((id) => allTasks[id] as Task<TArgs, TReturn> | undefined)
    .filter((t): t is Task<TArgs, TReturn> => t !== undefined);

  // Derived state from current task
  const status = task?.status ?? null;
  const result = (task?.result as TReturn) ?? null;
  const error = task?.error ?? null;
  const progress = task?.progress ?? null;
  const isLoading = status === 'pending' || status === 'running';

  // Handle task updates via callbacks
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    const cbs = callbacksRef.current;
    
    if (cbs.onStatusChange && updatedTask.status) {
      cbs.onStatusChange(updatedTask.status, updatedTask);
    }
    
    if (cbs.onProgress && updatedTask.progress !== undefined) {
      cbs.onProgress(updatedTask.progress, updatedTask);
    }
    
    if (updatedTask.status === 'completed' && cbs.onComplete) {
      cbs.onComplete(updatedTask.result, updatedTask);
    }
    
    if (updatedTask.status === 'failed' && cbs.onError && updatedTask.error) {
      cbs.onError(updatedTask.error, updatedTask);
    }
  }, []);

  // Subscribe to current task updates using callback-based subscription for side effects
  useEffect(() => {
    if (!autoSubscribe || !currentTaskId) return;

    unsubscribeRef.current = useTransportStore.getState().subscribeToTask(currentTaskId, handleTaskUpdate);

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [currentTaskId, autoSubscribe, handleTaskUpdate]);

  // Assign action
  const assign = useCallback(async (args: TArgs, options?: AssignOptions): Promise<Task<TArgs, TReturn>> => {
    setValidationError(null);

    // Validate args
    const parsed = definition.argsSchema.safeParse(args);
    if (!parsed.success) {
      setValidationError(parsed.error);
      throw parsed.error;
    }

    // Assign via transport
    const newTask = await transport.assign<TArgs, TReturn>(
      definition.name,
      parsed.data,
      options
    );

    setCurrentTaskId(newTask.id);
    setAllTaskIds((prev) => [...prev, newTask.id]);

    return newTask;
  }, [definition, transport]);

  // Refresh current task from server
  const refresh = useCallback(async (): Promise<void> => {
    if (!currentTaskId) return;
    await transport.getTask(currentTaskId);
  }, [currentTaskId, transport]);

  // Cancel current task
  const cancel = useCallback(async (): Promise<void> => {
    if (!currentTaskId) return;
    await transport.cancelTask(currentTaskId);
  }, [currentTaskId, transport]);

  // Clear current task reference
  const clear = useCallback((): void => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setCurrentTaskId(null);
    setValidationError(null);
  }, []);

  return {
    assign,
    task,
    tasks,
    status,
    result,
    error,
    progress,
    isLoading,
    validationError,
    refresh,
    cancel,
    clear,
  };
};

export default useTransportAction;
