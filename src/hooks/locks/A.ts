import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const ADefinition: LockDefinition<"a"> = {
  key: "a", // The ID used by the backend
};

/**
 * Hook to sync a
 */
export const useALock = (options?: UseLockSyncOptions) => {
  return useLockSync<"a">(ADefinition, options);
};
