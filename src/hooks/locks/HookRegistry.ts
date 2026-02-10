import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const HookRegistryDefinition: LockDefinition<"hook_registry"> = {
  key: "hook_registry", // The ID used by the backend
};

/**
 * Hook to sync hook_registry
 */
export const useHookRegistryLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"hook_registry">(HookRegistryDefinition, options);
};
