import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const MikrosckopeCameraParametersDefinition: LockDefinition<"camera_parameters"> =
  {
    // Lock schema for camera_parameters (You can add a "description" field in your schema for better documentation)
    appKey: "mikrosckope",
    key: "camera_parameters", // The ID used by the backend
  };

/**
 * Hook to sync camera_parameters
 */
export const useMikrosckopeCameraParametersLock = (
  options?: UseLockSyncOptions,
) => {
  return useLockSync<"camera_parameters">(
    MikrosckopeCameraParametersDefinition,
    options,
  );
};

export const useCameraParametersLock = useMikrosckopeCameraParametersLock;

export const CameraParametersDefinition = MikrosckopeCameraParametersDefinition;
