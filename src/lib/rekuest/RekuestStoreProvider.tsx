import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  createLockStoreRegistry,
  LockStoreContext,
} from '@/lib/rekuest/locks/store';
import {
  createGlobalStateStoreRegistry,
  GlobalStateStoreContext,
} from '@/lib/rekuest/state/store';
import {
  createTransportStoreRegistry,
  TransportStoreContext,
} from '@/lib/rekuest/task/store';
import { defaultAppKey } from '@/apps';

export interface RekuestStoreBundle {
  globalStateStore: ReturnType<typeof createGlobalStateStoreRegistry>;
  transportStore: ReturnType<typeof createTransportStoreRegistry>;
  lockStore: ReturnType<typeof createLockStoreRegistry>;
}

export interface RekuestStoreProviderProps {
  children: ReactNode;
  scope?: string;
}

const scopedBundles = new Map<string, RekuestStoreBundle>();

const createRekuestStoreBundle = (): RekuestStoreBundle => ({
  globalStateStore: createGlobalStateStoreRegistry(defaultAppKey),
  transportStore: createTransportStoreRegistry(defaultAppKey),
  lockStore: createLockStoreRegistry(defaultAppKey),
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
