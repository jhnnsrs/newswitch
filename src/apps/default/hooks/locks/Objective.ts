import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from "@/lib/rekuest/locks";

// --- Definition ---
export const ObjectiveDefinition: LockDefinition<"objective"> = {
  // Lock schema for objective (You can add a "description" field in your schema for better documentation)
  appKey: "default",
  key: "objective", // The ID used by the backend
};

/**
 * Hook to sync objective
 */
export const useObjectiveLock = (options?: UseLockOptions) => {
  return useLock<"objective">(ObjectiveDefinition, options);
};
