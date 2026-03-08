import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const MikrosckopeStagePositionDefinition: LockDefinition<"stage_position"> =
  {
    // Lock schema for stage_position (You can add a "description" field in your schema for better documentation)
    appKey: "mikrosckope",
    key: "stage_position", // The ID used by the backend
  };

/**
 * Hook to sync stage_position
 */
export const useMikrosckopeStagePositionLock = (
  options?: UseLockSyncOptions,
) => {
  return useLockSync<"stage_position">(
    MikrosckopeStagePositionDefinition,
    options,
  );
};

export const useStagePositionLock = useMikrosckopeStagePositionLock;

export const StagePositionDefinition = MikrosckopeStagePositionDefinition;
