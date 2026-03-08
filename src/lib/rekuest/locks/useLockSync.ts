import { useBlockingLock } from './store';
import { useTransport } from '@/lib/rekuest/transport/transport-context';
import { resolveLockAppKey } from './keys';
import type {
  LockDefinition,
  UseLockSyncOptions,
  UseLockSyncResult,
} from './types';

export const useLockSync = <T extends string>(
  definition: LockDefinition<T>,
  options: UseLockSyncOptions = {},
): UseLockSyncResult => {
  void options;
  const transport = useTransport();
  const appKey = resolveLockAppKey(definition, transport.defaultAppKey);
  const blockingLock = useBlockingLock(appKey, [definition.key]);

  return {
    isLocked: blockingLock.isLocked,
    lockKey: blockingLock.lockKey,
    lockingTaskId: blockingLock.lockingTaskId,
  };
};
