import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const MikrosckopeIlluminationDefinition: LockDefinition<"illumination"> =
  {
    // Lock schema for illumination (You can add a "description" field in your schema for better documentation)
    appKey: "mikrosckope",
    key: "illumination", // The ID used by the backend
  };

/**
 * Hook to sync illumination
 */
export const useMikrosckopeIlluminationLock = (
  options?: UseLockSyncOptions,
) => {
  return useLockSync<"illumination">(
    MikrosckopeIlluminationDefinition,
    options,
  );
};

export const useIlluminationLock = useMikrosckopeIlluminationLock;

export const IlluminationDefinition = MikrosckopeIlluminationDefinition;
