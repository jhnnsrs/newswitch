import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from "@/lib/rekuest/locks";

// --- Definition ---
export const FilterBankDefinition: LockDefinition<"filter_bank"> = {
  // Lock schema for filter_bank (You can add a "description" field in your schema for better documentation)
  appKey: "default",
  key: "filter_bank", // The ID used by the backend
};

/**
 * Hook to sync filter_bank
 */
export const useFilterBankLock = (options?: UseLockOptions) => {
  return useLock<"filter_bank">(FilterBankDefinition, options);
};
