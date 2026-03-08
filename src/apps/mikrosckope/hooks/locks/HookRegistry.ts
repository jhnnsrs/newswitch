import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const MikrosckopeHookRegistryDefinition: LockDefinition<"hook_registry"> =
  {
    // Lock schema for hook_registry (You can add a "description" field in your schema for better documentation)
    appKey: "mikrosckope",
    key: "hook_registry", // The ID used by the backend
  };

/**
 * Hook to sync hook_registry
 */
export const useMikrosckopeHookRegistryLock = (
  options?: UseLockSyncOptions,
) => {
  return useLockSync<"hook_registry">(
    MikrosckopeHookRegistryDefinition,
    options,
  );
};

export const useHookRegistryLock = useMikrosckopeHookRegistryLock;

export const HookRegistryDefinition = MikrosckopeHookRegistryDefinition;
