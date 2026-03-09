import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from '@/lib/rekuest/locks';

// --- Definition ---
export const ExpanseStateDefinition: LockDefinition<'expanse_state'> = {
  // Lock schema for expanse_state
  appKey: 'default',
  key: 'expanse_state',
};

/**
 * Hook to sync expanse_state
 */
export const useExpanseStateLock = (options?: UseLockOptions) => {
  return useLock<'expanse_state'>(ExpanseStateDefinition, options);
};
