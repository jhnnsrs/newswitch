import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const ODefinition: LockDefinition<"o"> = {
  key: "o", // The ID used by the backend
};

/**
 * Hook to sync o
 */
export const useOLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"o">(ODefinition, options);
};
