import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const TDefinition: LockDefinition<"t"> = {
  key: "t", // The ID used by the backend
};

/**
 * Hook to sync t
 */
export const useTLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"t">(TDefinition, options);
};
