import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const FilterBankDefinition: LockDefinition<"filter_bank"> = {
  key: "filter_bank", // The ID used by the backend
};

/**
 * Hook to sync filter_bank
 */
export const useFilterBankLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"filter_bank">(FilterBankDefinition, options);
};
