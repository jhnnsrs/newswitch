import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const MikrosckopeFilterBankDefinition: LockDefinition<"filter_bank"> = {
  // Lock schema for filter_bank (You can add a "description" field in your schema for better documentation)
  appKey: "mikrosckope",
  key: "filter_bank", // The ID used by the backend
};

/**
 * Hook to sync filter_bank
 */
export const useMikrosckopeFilterBankLock = (options?: UseLockSyncOptions) => {
  return useLockSync<"filter_bank">(MikrosckopeFilterBankDefinition, options);
};

export const useFilterBankLock = useMikrosckopeFilterBankLock;

export const FilterBankDefinition = MikrosckopeFilterBankDefinition;
