import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const IoDefinition: LockDefinition<"io"> = {
  // Lock schema for io (You can add a "description" field in your schema for better documentation)
  appKey: "default",
  key: "io", // The ID used by the backend
};

/**
 * Hook to sync io
 */
export const useIoLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"io">(IoDefinition, options);
};
