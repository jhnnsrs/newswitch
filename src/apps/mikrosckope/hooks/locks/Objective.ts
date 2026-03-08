import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const MikrosckopeObjectiveDefinition: LockDefinition<"objective"> = {
  // Lock schema for objective (You can add a "description" field in your schema for better documentation)
  appKey: "mikrosckope",
  key: "objective", // The ID used by the backend
};

/**
 * Hook to sync objective
 */
export const useMikrosckopeObjectiveLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"objective">(MikrosckopeObjectiveDefinition, options);
};

export const useObjectiveLock = useMikrosckopeObjectiveLock;

export const ObjectiveDefinition = MikrosckopeObjectiveDefinition;
