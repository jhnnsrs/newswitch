// src/hooks/useLockSync.ts
import { useBlockingLock } from "../store";

// --- The Definition Interface ---
export interface LockDefinition<T extends string> {
  key: T;
}

export interface UseLockSyncOptions {
  /** Whether to subscribe to real-time updates via WebSocket (default: false) */
  subscribe?: boolean;
  /** Whether to fetch the initial state on mount (default: true) */
  fetchOnMount?: boolean;
}

export interface UseLockSyncResult {
  /** Whether the resource is currently locked */
  isLocked: boolean;
  /** The lock key currently blocking the resource */
  lockKey: string | null;
  /** The active task holding the lock */
  lockingTaskId: string | undefined;
}

export const useLockSync = <T extends string>(
  definition: LockDefinition<T>,
  options: UseLockSyncOptions = {},
): UseLockSyncResult => {
  void options;
  const blockingLock = useBlockingLock([definition.key]);

  return {
    isLocked: blockingLock.isLocked,
    lockKey: blockingLock.lockKey,
    lockingTaskId: blockingLock.lockingTaskId,
  };
};
