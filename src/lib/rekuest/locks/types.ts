export interface LockDefinition<T extends string> {
  key: T;
  appKey?: string;
}

export interface UseLockSyncOptions {
  subscribe?: boolean;
  fetchOnMount?: boolean;
}

export interface UseLockSyncResult {
  isLocked: boolean;
  lockKey: string | null;
  lockingTaskId: string | undefined;
}
