import {
  useLock,
  type LockDefinition,
  type UseLockOptions,
} from "@/lib/rekuest/locks";

// --- Definition ---
export const ExpanseStateDefinition: LockDefinition<"expanse_state"> = {
  // Lock schema for expanse_state (You can add a "description" field in your schema for better documentation)
  appKey: "default",
  key: "expanse_state", // The ID used by the backend
};

/**
 * Hook to sync expanse_state
 */
export const useExpanseStateLock = (options?: UseLockOptions) => {
  return useLock<"expanse_state">(ExpanseStateDefinition, options);
};
