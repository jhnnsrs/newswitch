import type { LockDefinition } from './types';

export const getScopedLockKey = (appKey: string, lockKey: string) =>
  `${appKey}::lock::${lockKey}`;

export const scopeLockKeys = (appKey: string, lockKeys: string[]) =>
  lockKeys.map((lockKey) => getScopedLockKey(appKey, lockKey));

export const resolveLockAppKey = <TAppKey extends string>(
  definition: Pick<LockDefinition<string>, 'appKey'>,
  defaultAppKey: TAppKey,
): TAppKey => (definition.appKey as TAppKey | undefined) ?? defaultAppKey;
