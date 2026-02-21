import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const ObjectiveDefinition: LockDefinition<"objective"> = {
  // Lock schema for objective (You can add a "description" field in your schema for better documentation)
  key: "objective", // The ID used by the backend
};

/**
 * Hook to sync objective
 */
export const useObjectiveLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"objective">(ObjectiveDefinition, options);
};
