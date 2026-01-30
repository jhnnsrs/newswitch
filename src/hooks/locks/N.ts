import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const NDefinition: LockDefinition<"n"> = {
  key: "n", // The ID used by the backend
};

/**
 * Hook to sync n
 */
export const useNLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"n">(NDefinition, options);
};
