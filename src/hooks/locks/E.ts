import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const EDefinition: LockDefinition<"e"> = {
  key: "e", // The ID used by the backend
};

/**
 * Hook to sync e
 */
export const useELock = (options?: UseLockSyncOptions) => {
  return useLockSync<"e">(EDefinition, options);
};
