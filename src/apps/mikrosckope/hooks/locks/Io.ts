import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const MikrosckopeIoDefinition: LockDefinition<"io"> = {
  // Lock schema for io (You can add a "description" field in your schema for better documentation)
  appKey: "mikrosckope",
  key: "io", // The ID used by the backend
};

/**
 * Hook to sync io
 */
export const useMikrosckopeIoLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"io">(MikrosckopeIoDefinition, options);
};

export const useIoLock = useMikrosckopeIoLock;

export const IoDefinition = MikrosckopeIoDefinition;
