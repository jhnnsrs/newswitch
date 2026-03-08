import type { AppKey } from '@/apps';
import type { LockDefinition } from './types';

export const getScopedLockKey = (appKey: string, lockKey: string) =>
  `${appKey}::lock::${lockKey}`;

export const scopeLockKeys = (appKey: string, lockKeys: string[]) =>
  lockKeys.map((lockKey) => getScopedLockKey(appKey, lockKey));

export const resolveLockAppKey = (
  definition: Pick<LockDefinition<string>, 'appKey'>,
  defaultAppKey: AppKey,
): AppKey => (definition.appKey as AppKey | undefined) ?? defaultAppKey;
