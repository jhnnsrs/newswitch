import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from '@/lib/rekuest/locks';

// --- Definition ---
export const ObjectiveDefinition: LockDefinition<'objective'> = {
  // Lock schema for objective
  appKey: 'default',
  key: 'objective',
};

/**
 * Hook to sync objective
 */
export const useObjectiveLock = (options?: UseLockOptions) => {
  return useLock<'objective'>(ObjectiveDefinition, options);
};
