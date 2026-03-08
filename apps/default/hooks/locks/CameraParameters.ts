import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from "@/lib/rekuest/locks";

// --- Definition ---
export const CameraParametersDefinition: LockDefinition<"camera_parameters"> = {
  // Lock schema for camera_parameters (You can add a "description" field in your schema for better documentation)
  appKey: "default",
  key: "camera_parameters", // The ID used by the backend
};

/**
 * Hook to sync camera_parameters
 */
export const useCameraParametersLock = (options?: UseLockOptions) => {
  return useLock<"camera_parameters">(CameraParametersDefinition, options);
};
