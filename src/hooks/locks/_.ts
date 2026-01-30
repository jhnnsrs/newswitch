import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const _Definition: LockDefinition<"_"> = {
  key: "_", // The ID used by the backend
};

/**
 * Hook to sync _
 */
export const use_Lock = (options?: UseLockSyncOptions) => {
  return useLockSync<"_">(_Definition, options);
};
