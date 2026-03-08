import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const FilterBankDefinition: LockDefinition<"filter_bank"> = {
  // Lock schema for filter_bank (You can add a "description" field in your schema for better documentation)
  appKey: "default",
  key: "filter_bank", // The ID used by the backend
};

/**
 * Hook to sync filter_bank
 */
export const useFilterBankLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"filter_bank">(FilterBankDefinition, options);
};
