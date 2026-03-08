import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from "@/lib/rekuest/locks";

// --- Definition ---
export const HookRegistryDefinition: LockDefinition<"hook_registry"> = {
  // Lock schema for hook_registry (You can add a "description" field in your schema for better documentation)
  appKey: "default",
  key: "hook_registry", // The ID used by the backend
};

/**
 * Hook to sync hook_registry
 */
export const useHookRegistryLock = (options?: UseLockOptions) => {
  return useLock<"hook_registry">(HookRegistryDefinition, options);
};
