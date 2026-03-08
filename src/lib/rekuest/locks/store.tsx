import { createContext, useContext, useMemo } from 'react';
import { useStore } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createStore, type StoreApi } from 'zustand/vanilla';

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

const resolveBlockingLock = (
  locks: Record<string, string | undefined | null> | undefined,
  lockKeys: string[],
): BlockingLockState | null => {
  if (!locks) {
    return null;
  }

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

  return null;
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

export interface LockStoreRegistry {
  defaultAppKey: string;
  getStoreApi: (appKey?: string) => StoreApi<LockStore>;
  getStoreEntries: () => Array<[string, StoreApi<LockStore>]>;
}

export const createLockStoreRegistry = (defaultAppKey: string): LockStoreRegistry => {
  const stores = new Map<string, StoreApi<LockStore>>();

  const getStoreApi = (appKey = defaultAppKey) => {
    const existingStore = stores.get(appKey);
    if (existingStore) {
      return existingStore;
    }

    const nextStore = createLockStore();
    stores.set(appKey, nextStore);
    return nextStore;
  };

  return {
    defaultAppKey,
    getStoreApi,
    getStoreEntries: () => Array.from(stores.entries()),
  };
};

export const LockStoreContext = createContext<LockStoreRegistry | null>(null);

export const useLockStoreRegistry = (): LockStoreRegistry => {
  const registry = useContext(LockStoreContext);

  if (!registry) {
    throw new Error('Missing LockStoreProvider');
  }

  return registry;
};

export function useLockStoreApi(appKey?: string) {
  return useLockStoreRegistry().getStoreApi(appKey);
}

export function useLockStore<TSelected>(
  selector: (state: LockStore) => TSelected,
): TSelected;
export function useLockStore<TSelected>(
  appKey: string,
  selector: (state: LockStore) => TSelected,
): TSelected;
export function useLockStore<TSelected>(
  appKeyOrSelector: string | ((state: LockStore) => TSelected),
  maybeSelector?: (state: LockStore) => TSelected,
): TSelected {
  const registry = useLockStoreRegistry();
  const appKey = typeof appKeyOrSelector === 'string'
    ? appKeyOrSelector
    : registry.defaultAppKey;
  const selector = typeof appKeyOrSelector === 'string'
    ? maybeSelector
    : appKeyOrSelector;

  if (!selector) {
    throw new Error('Missing lock selector');
  }

  return useStore(registry.getStoreApi(appKey), selector);
}

export const selectLock =
  (key: string) =>
  (store: LockStore): string | undefined | null =>
    store.locks[key];

export function getBlockingLock(
  locks: Record<string, string | undefined | null>,
  lockKeys: string[] = [],
): BlockingLockState;
export function getBlockingLock(
  locks: Record<string, string | undefined | null>,
  lockKeys: string[] = [],
): BlockingLockState {
  return resolveBlockingLock(locks, lockKeys) ?? unlockedState;
}

export function useBlockingLock(lockKeys?: string[]): BlockingLockState;
export function useBlockingLock(appKey: string, lockKeys?: string[]): BlockingLockState;
export function useBlockingLock(
  appKeyOrLockKeys: string | string[] = [],
  maybeLockKeys: string[] = [],
): BlockingLockState {
  const locks = Array.isArray(appKeyOrLockKeys)
    ? useLockStore((state) => state.locks)
    : useLockStore(appKeyOrLockKeys, (state) => state.locks);

  return useMemo(() => {
    if (Array.isArray(appKeyOrLockKeys)) {
      return getBlockingLock(locks, appKeyOrLockKeys);
    }

    return getBlockingLock(locks, maybeLockKeys);
  }, [appKeyOrLockKeys, locks, maybeLockKeys]);
}
