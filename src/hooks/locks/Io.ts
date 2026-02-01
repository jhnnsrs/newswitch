import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const IoDefinition: LockDefinition<"io"> = {
  key: "io", // The ID used by the backend
};

/**
 * Hook to sync io
 */
export const useIoLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"io">(IoDefinition, options);
};
