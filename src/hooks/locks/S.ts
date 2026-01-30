import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const SDefinition: LockDefinition<"s"> = {
  key: "s", // The ID used by the backend
};

/**
 * Hook to sync s
 */
export const useSLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"s">(SDefinition, options);
};
