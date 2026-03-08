import { useMemo } from 'react';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';
import { createScopedStoreHooks } from '@/lib/rekuest/createScopedStore';

export interface LockStore {
  locks: Record<string, string | undefined | null>;
  setLock: (key: string, value: string | undefined) => void;
  replaceLocks: (locks: Record<string, string | undefined>) => void;
  clearLock: (key: string) => void;
  clearLocks: () => void;
}

export interface BlockingLockState {
  isLocked: boolean;
  lockKey: string | null;
  lockingTaskId: string | undefined;
}

const unlockedState: BlockingLockState = {
  isLocked: false,
  lockKey: null,
  lockingTaskId: undefined,
};

export const createLockStore = () =>
  createStore<LockStore>()(
    subscribeWithSelector(
      immer((set) => ({
        locks: {},

        setLock: (key, value) => {
          set((state) => {
            state.locks[key] = value;
          });
        },

        replaceLocks: (locks) => {
          set((state) => {
            state.locks = { ...locks };
          });
        },

        clearLock: (key) => {
          set((state) => {
            delete state.locks[key];
          });
        },

        clearLocks: () => {
          set((state) => {
            state.locks = {};
          });
        },
      })),
    ),
  );

const {
  StoreContext: LockStoreContext,
  useScopedStore: useLockStore,
  useStoreApi: useLockStoreApi,
} = createScopedStoreHooks<LockStore, ReturnType<typeof createLockStore>>(
  'LockStore',
);

export { LockStoreContext, useLockStore, useLockStoreApi };

export const selectLock =
  (key: string) =>
  (store: LockStore): string | undefined =>
    store.locks[key];

export function getBlockingLock(
  locks: Record<string, string | undefined | null>,
  lockKeys: string[] = [],
): BlockingLockState {
  for (const key of lockKeys) {
    const lockingTaskId = locks[key];

    if (lockingTaskId !== undefined && lockingTaskId !== null) {
      return {
        isLocked: true,
        lockKey: key,
        lockingTaskId,
      };
    }
  }

  return unlockedState;
}

export function useBlockingLock(lockKeys: string[] = []): BlockingLockState {
  const locks = useLockStore((state) => state.locks);

  return useMemo(() => getBlockingLock(locks, lockKeys), [lockKeys, locks]);
}
