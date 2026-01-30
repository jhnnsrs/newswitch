import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const GDefinition: LockDefinition<"g"> = {
  key: "g", // The ID used by the backend
};

/**
 * Hook to sync g
 */
export const useGLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"g">(GDefinition, options);
};
