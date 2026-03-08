// src/hooks/useLockSync.ts
import { getScopedLockKey, resolveLockAppKey } from "@/lib/rekuest/locks";
import { useBlockingLock } from "../store";
import { useTransport } from "../transport/transport-context";

// --- The Definition Interface ---
export interface LockDefinition<T extends string> {
  key: T;
  appKey?: string;
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
  const transport = useTransport();

  const appKey = resolveLockAppKey(definition, transport.defaultAppKey);

  const blockingLock = useBlockingLock([
    getScopedLockKey(appKey, definition.key),
  ]);

  return {
    isLocked: blockingLock.isLocked,
    lockKey: blockingLock.lockKey,
    lockingTaskId: blockingLock.lockingTaskId,
  };
};
