import type { AppKey } from '@/apps';
import { useCallback } from 'react';
import { useAction as useActionContext } from '@/transport/action-context';
import type { UseAppTaskMutationResult } from './types';

export const useCancelAppTask = (appKey: AppKey): UseAppTaskMutationResult => {
  const action = useActionContext();

  return useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.cancelTask(appKey, taskId);
    },
    [action, appKey],
  );
};

export const usePauseAppTask = (appKey: AppKey): UseAppTaskMutationResult => {
  const action = useActionContext();

  return useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.pauseTask(appKey, taskId);
    },
    [action, appKey],
  );
};

export const useResumeAppTask = (appKey: AppKey): UseAppTaskMutationResult => {
  const action = useActionContext();

  return useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.unpauseTask(appKey, taskId);
    },
    [action, appKey],
  );
};

export const useStepAppTask = (appKey: AppKey): UseAppTaskMutationResult => {
  const action = useActionContext();

  return useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.stepTask(appKey, taskId);
    },
    [action, appKey],
  );
};
