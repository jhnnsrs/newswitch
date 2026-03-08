import type { ActionDefinition } from './types';

export const getScopedTaskReference = (appKey: string, reference: string) =>
  `${appKey}::task-ref::${reference}`;

export const getScopedTaskId = (appKey: string, taskId: string) =>
  `${appKey}::task-id::${taskId}`;

export const resolveActionAppKey = <TAppKey extends string>(
  definition: Pick<ActionDefinition<unknown, unknown>, 'appKey'>,
  defaultAppKey: TAppKey,
): TAppKey => (definition.appKey as TAppKey | undefined) ?? defaultAppKey;
