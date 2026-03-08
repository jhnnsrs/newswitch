import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import {
  getBlockingLock,
  useBlockingLock,
  useLockStoreApi,
} from '@/lib/rekuest/locks/store';
import {
  selectTask,
  useTaskStore,
} from '@/lib/rekuest/task/store';
import { useAction as useActionContext } from '@/transport/action-context';
import { useTransport } from '@/transport/transport-context';
import type { AssignOptions, Task } from '@/transport/types';
import { resolveActionAppKey } from './keys';
import type {
  ActionDefinition,
  UseActionOptions,
  UseActionResult,
  UseTransportActionOptions,
  UseTransportActionResult,
} from './types';

export const useAction = <TArgs, TReturn>(
  definition: ActionDefinition<TArgs, TReturn>,
  options: UseActionOptions = {},
): UseActionResult<TArgs, TReturn> => {
  const {
    autoSubscribe = true,
    onStatusChange,
    onComplete,
    onError,
    onProgress,
  } = options;

  const action = useActionContext();
  const transport = useTransport();
  const lockStoreApi = useLockStoreApi();
  const appKey = resolveActionAppKey(definition, transport.defaultAppKey);
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

  const taskSelector = useMemo(() => {
    return currentReference
      ? selectTask<TArgs, TReturn>(currentReference)
      : () => undefined;
  }, [currentReference]);

  const task = useTaskStore(appKey, taskSelector) ?? null;
  const {
    isLocked,
    lockKey: blockingLockKey,
    lockingTaskId,
  } = useBlockingLock(appKey, definition.lockKeys);
  const lockedBy = lockingTaskId ?? null;

  const currentTaskId = task?.id;
  const status = task?.status ?? null;
  const result = (task?.result as TReturn) ?? null;
  const error = task?.error ?? null;
  const progress = task?.progress ?? null;
  const isLoading = status === 'pending' || status === 'running';

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    const cbs = callbacksRef.current;
    if (cbs.onStatusChange) cbs.onStatusChange(updatedTask.status, updatedTask);
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

  useEffect(() => {
    if (!autoSubscribe || !currentReference) return;

    const unsubscribe = action.subscribeToTask(
      currentReference,
      appKey,
      (updatedTask) => {
        handleTaskUpdate(updatedTask as Task);
      },
    );

    return () => unsubscribe();
  }, [action, appKey, autoSubscribe, currentReference, handleTaskUpdate]);

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

      return await action.assign<TArgs, TReturn>(
        appKey,
        definition.name,
        parsed.data,
        { ...opts, reference },
      );
    },
    [action, appKey, definition, lockStoreApi],
  );

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

      const taskState = await action.waitForTask<TArgs, TReturn>(appKey, reference);
      const parsed = definition.returnSchema.safeParse(taskState.result);

      if (!parsed.success) {
        throw new Error(
          `Return value failed schema validation: ${parsed.error.message}`,
        );
      }

      return parsed.data;
    },
    [action, appKey, definition.returnSchema, execute],
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (!currentTaskId) return;
    await action.getTask(appKey, currentTaskId);
  }, [action, appKey, currentTaskId]);

  const cancel = useCallback(async (): Promise<void> => {
    if (!currentTaskId) return;
    await action.cancelTask(appKey, currentTaskId);
  }, [action, appKey, currentTaskId]);

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

export const useTransportAction = useAction;

export type { UseTransportActionOptions, UseTransportActionResult };
