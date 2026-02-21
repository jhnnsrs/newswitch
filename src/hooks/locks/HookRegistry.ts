import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const HookRegistryDefinition: LockDefinition<"hook_registry"> = {
  // Lock schema for hook_registry (You can add a "description" field in your schema for better documentation)
  key: "hook_registry", // The ID used by the backend
};

/**
 * Hook to sync hook_registry
 */
export const useHookRegistryLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"hook_registry">(HookRegistryDefinition, options);
};
