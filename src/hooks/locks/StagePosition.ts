import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const StagePositionDefinition: LockDefinition<"stage_position"> = {
  key: "stage_position", // The ID used by the backend
};

/**
 * Hook to sync stage_position
 */
export const useStagePositionLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"stage_position">(StagePositionDefinition, options);
};
