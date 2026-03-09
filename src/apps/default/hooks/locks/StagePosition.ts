import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from "@/lib/rekuest/locks";

// --- Definition ---
export const StagePositionDefinition: LockDefinition<"stage_position"> = {
  // Lock schema for stage_position (You can add a "description" field in your schema for better documentation)
  appKey: "default",
  key: "stage_position", // The ID used by the backend
};

/**
 * Hook to sync stage_position
 */
export const useStagePositionLock = (options?: UseLockOptions) => {
  return useLock<"stage_position">(StagePositionDefinition, options);
};
