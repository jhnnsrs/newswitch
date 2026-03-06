// src/transport/useTransportAction.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z, ZodType } from "zod";
import {
  getBlockingLock,
  selectTask,
  useBlockingLock,
  useLockStoreApi,
  useTransportStore,
} from "../store";
import { useAction } from "./action-context";
import type { AssignOptions, Task, TaskStatus } from "./types";

export interface ActionDefinition<TArgs, TReturn> {
  name: string;
  description?: string;
  argsSchema: ZodType<TArgs>;
  returnSchema: ZodType<TReturn>;
  lockKeys: string[];
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
  /** Assign and wait for the final result via Promise */
  call: (args: TArgs, options?: AssignOptions) => Promise<TReturn>;
  /** Assign (execute) the action and resolve immediately with the Task object */
  assign: (
    args: TArgs,
    options?: AssignOptions,
  ) => Promise<Task<TArgs, TReturn>>;
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
  /** Whether the action is locked by another task */
  isLocked: boolean;
  /** The taskId that is blocking this action (if locked) */
  lockedBy: string | null;
  /** The lock key name that is blocking this action (if locked) */
  lockedByKey: string | null;
  /** Validation error from args schema */
  validationError: z.ZodError | null;
  /** Refresh task state from server */
  refresh: () => Promise<void>;
  /** Cancel the current task */
  cancel: () => Promise<void>;
  /** Clear current task reference */
  clear: () => void;
}

export const useTransportAction = <TArgs, TReturn>(
  definition: ActionDefinition<TArgs, TReturn>,
  options: UseTransportActionOptions = {},
): UseTransportActionResult<TArgs, TReturn> => {
  const {
    autoSubscribe = true,
    onStatusChange,
    onComplete,
    onError,
    onProgress,
  } = options;

  const action = useAction();
  const lockStoreApi = useLockStoreApi();

  // Track strictly by reference
  const [currentReference, setCurrentReference] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<z.ZodError | null>(
    null,
  );

  const callbacksRef = useRef({
    onStatusChange,
    onComplete,
    onError,
    onProgress,
  });

  useEffect(() => {
    callbacksRef.current = { onStatusChange, onComplete, onError, onProgress };
  }, [onStatusChange, onComplete, onError, onProgress]);

  // --- Selectors ---

  // Create a memoized selector for the current reference to prevent unnecessary rerenders
  const taskSelector = useMemo(() => {
    return currentReference
      ? selectTask<TArgs, TReturn>(currentReference)
      : () => undefined;
  }, [currentReference]);

  const task = useTransportStore(taskSelector) ?? null;

  const {
    isLocked,
    lockKey: blockingLockKey,
    lockingTaskId,
  } = useBlockingLock(definition.lockKeys);
  const lockedBy = lockingTaskId ?? null;

  // --- Derived State ---
  const currentTaskId = task?.id; // Will be the server ID if setAssignationID was called by transport, or fallback reference
  const status = task?.status ?? null;
  const result = (task?.result as TReturn) ?? null;
  const error = task?.error ?? null;
  const progress = task?.progress ?? null;
  const isLoading = status === "pending" || status === "running";

  // --- Task Lifecycle Handlers ---
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    const cbs = callbacksRef.current;
    if (cbs.onStatusChange) cbs.onStatusChange(updatedTask.status, updatedTask);
    if (cbs.onProgress && updatedTask.progress !== undefined)
      cbs.onProgress(updatedTask.progress, updatedTask);

    if (updatedTask.status === "completed" && cbs.onComplete) {
      cbs.onComplete(updatedTask.result, updatedTask);
    }
    if (updatedTask.status === "failed" && cbs.onError && updatedTask.error) {
      cbs.onError(updatedTask.error, updatedTask);
    }
  }, []);

  useEffect(() => {
    if (!autoSubscribe || !currentReference) return;

    const unsubscribe = action.subscribeToTask(currentReference, (updatedTask) => {
      handleTaskUpdate(updatedTask as Task);
    });

    return () => unsubscribe();
  }, [action, autoSubscribe, currentReference, handleTaskUpdate]);

  // --- Core Execution Logic ---
  const execute = useCallback(
    async (
      args: TArgs,
      opts?: AssignOptions,
    ): Promise<Task<TArgs, TReturn>> => {
      setValidationError(null);

      const { lockKey, lockingTaskId: currentLockingTaskId } = getBlockingLock(
        lockStoreApi.getState().locks,
        definition.lockKeys,
      );

      if (lockKey) {
        throw new Error(
          `Action is locked by task ${currentLockingTaskId} (lock: ${lockKey})`,
        );
      }

      const parsed = definition.argsSchema.safeParse(args);
      if (!parsed.success) {
        setValidationError(parsed.error);
        throw parsed.error;
      }

      const reference = opts?.reference || action.createReference();
      setCurrentReference(reference);

      // The transport.assign method is now strictly responsible for calling setAssignationID
      // internally once it receives the server response.
      const newTask = await action.assign<TArgs, TReturn>(
        definition.name,
        parsed.data,
        { ...opts, reference },
      );

      return newTask;
    },
    [action, definition, lockStoreApi],
  );

  // --- Public Methods ---
  const assign = useCallback(
    async (args: TArgs, opts?: AssignOptions) => {
      return await execute(args, opts);
    },
    [execute],
  );

  const call = useCallback(
    async (args: TArgs, opts?: AssignOptions): Promise<TReturn> => {
      const reference = opts?.reference || action.createReference();

      await execute(args, { ...opts, reference });

      const taskState = await action.waitForTask<TArgs, TReturn>(reference);
      const parsed = definition.returnSchema.safeParse(taskState.result);

      if (!parsed.success) {
        throw new Error(
          `Return value failed schema validation: ${parsed.error.message}`,
        );
      }

      return parsed.data;
    },
    [action, definition.returnSchema, execute],
  );

  const refresh = useCallback(async (): Promise<void> => {
    // We send the resolved currentTaskId to the server, as it needs its own assignation ID
    if (!currentTaskId) return;
    await action.getTask(currentTaskId);
  }, [action, currentTaskId]);

  const cancel = useCallback(async (): Promise<void> => {
    if (!currentTaskId) return;
    await action.cancelTask(currentTaskId);
  }, [action, currentTaskId]);

  const clear = useCallback((): void => {
    setCurrentReference(null);
    setValidationError(null);
  }, []);

  return {
    call,
    assign,
    status,
    result,
    error,
    progress,
    isLoading,
    isLocked,
    lockedBy,
    lockedByKey: blockingLockKey ?? null,
    validationError,
    refresh,
    cancel,
    clear,
  };
};

export default useTransportAction;
