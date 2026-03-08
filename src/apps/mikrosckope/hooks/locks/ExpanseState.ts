import {
  useLockSync,
  type LockDefinition,
  type UseLockSyncOptions,
} from "../useLockSync";

// --- Definition ---
export const MikrosckopeExpanseStateDefinition: LockDefinition<"expanse_state"> =
  {
    // Lock schema for expanse_state (You can add a "description" field in your schema for better documentation)
    appKey: "mikrosckope",
    key: "expanse_state", // The ID used by the backend
  };

/**
 * Hook to sync expanse_state
 */
export const useMikrosckopeExpanseStateLock = (
  options?: UseLockSyncOptions,
) => {
  return useLockSync<"expanse_state">(
    MikrosckopeExpanseStateDefinition,
    options,
  );
};

export const useExpanseStateLock = useMikrosckopeExpanseStateLock;

export const ExpanseStateDefinition = MikrosckopeExpanseStateDefinition;
