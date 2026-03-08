import type { AppKey } from '@/apps';
import type { ActionDefinition } from './types';

export const getScopedTaskReference = (appKey: string, reference: string) =>
  `${appKey}::task-ref::${reference}`;

export const getScopedTaskId = (appKey: string, taskId: string) =>
  `${appKey}::task-id::${taskId}`;

export const resolveActionAppKey = (
  definition: Pick<ActionDefinition<unknown, unknown>, 'appKey'>,
  defaultAppKey: AppKey,
): AppKey => (definition.appKey as AppKey | undefined) ?? defaultAppKey;
