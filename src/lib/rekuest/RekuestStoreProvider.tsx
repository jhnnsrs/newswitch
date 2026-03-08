import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  createLockStore,
  LockStoreContext,
} from '@/lib/rekuest/locks/store';
import {
  createGlobalStateStore,
  GlobalStateStoreContext,
} from '@/lib/rekuest/state/store';
import {
  createTransportStore,
  TransportStoreContext,
} from '@/lib/rekuest/task/store';

export interface RekuestStoreBundle {
  globalStateStore: ReturnType<typeof createGlobalStateStore>;
  transportStore: ReturnType<typeof createTransportStore>;
  lockStore: ReturnType<typeof createLockStore>;
}

export interface RekuestStoreProviderProps {
  children: ReactNode;
  scope?: string;
}

const scopedBundles = new Map<string, RekuestStoreBundle>();

const createRekuestStoreBundle = (): RekuestStoreBundle => ({
  globalStateStore: createGlobalStateStore(),
  transportStore: createTransportStore(),
  lockStore: createLockStore(),
});

const getScopedBundle = (scope: string): RekuestStoreBundle => {
  const existingBundle = scopedBundles.get(scope);

  if (existingBundle) {
    return existingBundle;
  }

  const nextBundle = createRekuestStoreBundle();
  scopedBundles.set(scope, nextBundle);
  return nextBundle;
};

export function RekuestStoreProvider({
  children,
  scope = 'default',
}: RekuestStoreProviderProps) {
  const stores = useMemo(() => getScopedBundle(scope), [scope]);

  return (
    <GlobalStateStoreContext.Provider value={stores.globalStateStore}>
      <TransportStoreContext.Provider value={stores.transportStore}>
        <LockStoreContext.Provider value={stores.lockStore}>
          {children}
        </LockStoreContext.Provider>
      </TransportStoreContext.Provider>
    </GlobalStateStoreContext.Provider>
  );
}
