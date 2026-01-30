import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const PDefinition: LockDefinition<"p"> = {
  key: "p", // The ID used by the backend
};

/**
 * Hook to sync p
 */
export const usePLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"p">(PDefinition, options);
};
