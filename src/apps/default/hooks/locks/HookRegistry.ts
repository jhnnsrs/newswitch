import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from '@/lib/rekuest/locks';

// --- Definition ---
export const HookRegistryDefinition: LockDefinition<'hook_registry'> = {
  // Lock schema for hook_registry
  appKey: 'default',
  key: 'hook_registry',
};

/**
 * Hook to sync hook_registry
 */
export const useHookRegistryLock = (options?: UseLockOptions) => {
  return useLock<'hook_registry'>(HookRegistryDefinition, options);
};
