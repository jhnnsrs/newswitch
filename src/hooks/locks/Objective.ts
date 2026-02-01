import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const ObjectiveDefinition: LockDefinition<"objective"> = {
  key: "objective", // The ID used by the backend
};

/**
 * Hook to sync objective
 */
export const useObjectiveLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"objective">(ObjectiveDefinition, options);
};
