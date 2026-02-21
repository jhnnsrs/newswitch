import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const IlluminationDefinition: LockDefinition<"illumination"> = {
  // Lock schema for illumination (You can add a "description" field in your schema for better documentation)
  key: "illumination", // The ID used by the backend
};

/**
 * Hook to sync illumination
 */
export const useIlluminationLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"illumination">(IlluminationDefinition, options);
};
