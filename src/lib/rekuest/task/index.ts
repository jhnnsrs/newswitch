import type { AppKey } from '@/apps';
import { useCallback } from 'react';
import { useAction } from '@/transport/action-context';
import type { ActionDefinition } from '@/transport/useTransportAction';

export const getScopedTaskReference = (appKey: string, reference: string) =>
  `${appKey}::task-ref::${reference}`;

export const getScopedTaskId = (appKey: string, taskId: string) =>
  `${appKey}::task-id::${taskId}`;

export const resolveActionAppKey = (
  definition: Pick<ActionDefinition<unknown, unknown>, 'appKey'>,
  defaultAppKey: AppKey,
): AppKey => (definition.appKey as AppKey | undefined) ?? defaultAppKey;

export type UseAppTaskMutationResult = (taskId: string) => Promise<void>;

export const useCancelAppTask = (appKey: AppKey): UseAppTaskMutationResult => {
  const action = useAction();

  return useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.cancelTask(appKey, taskId);
    },
    [action, appKey],
  );
};

export const usePauseAppTask = (appKey: AppKey): UseAppTaskMutationResult => {
  const action = useAction();

  return useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.pauseTask(appKey, taskId);
    },
    [action, appKey],
  );
};

export const useResumeAppTask = (appKey: AppKey): UseAppTaskMutationResult => {
  const action = useAction();

  return useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.unpauseTask(appKey, taskId);
    },
    [action, appKey],
  );
};

export const useStepAppTask = (appKey: AppKey): UseAppTaskMutationResult => {
  const action = useAction();

  return useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.stepTask(appKey, taskId);
    },
    [action, appKey],
  );
};