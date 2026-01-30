import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const IDefinition: LockDefinition<"i"> = {
  key: "i", // The ID used by the backend
};

/**
 * Hook to sync i
 */
export const useILock = (options?: UseLockSyncOptions) => {
  return useLockSync<"i">(IDefinition, options);
};
