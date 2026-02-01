import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const CameraParametersDefinition: LockDefinition<"camera_parameters"> = {
  key: "camera_parameters", // The ID used by the backend
};

/**
 * Hook to sync camera_parameters
 */
export const useCameraParametersLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"camera_parameters">(CameraParametersDefinition, options);
};
