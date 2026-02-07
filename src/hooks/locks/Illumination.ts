import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const IlluminationDefinition: LockDefinition<"illumination"> = {
  key: "illumination", // The ID used by the backend
};

/**
 * Hook to sync illumination
 */
export const useIlluminationLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"illumination">(IlluminationDefinition, options);
};
