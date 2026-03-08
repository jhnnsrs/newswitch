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
  createTaskStoreRegistry,
  TaskStoreContext,
} from '@/lib/rekuest/task/store';
import {
  createTransportStore,
  TransportStoreContext,
} from '@/lib/rekuest/transport/store';
import { defaultAppKey } from '@/apps';

export interface RekuestStoreBundle {
  globalStateStore: ReturnType<typeof createGlobalStateStoreRegistry>;
  taskStore: ReturnType<typeof createTaskStoreRegistry>;
  transportStore: ReturnType<typeof createTransportStore>;
  lockStore: ReturnType<typeof createLockStoreRegistry>;
}

export interface RekuestStoreProviderProps {
  children: ReactNode;
  scope?: string;
}

const scopedBundles = new Map<string, RekuestStoreBundle>();

const createRekuestStoreBundle = (): RekuestStoreBundle => {
  const transportStore = createTransportStore();

  return {
    globalStateStore: createGlobalStateStoreRegistry(defaultAppKey),
    taskStore: createTaskStoreRegistry(defaultAppKey, transportStore),
    transportStore,
    lockStore: createLockStoreRegistry(defaultAppKey),
  };
};

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
        <TaskStoreContext.Provider value={stores.taskStore}>
          <LockStoreContext.Provider value={stores.lockStore}>
            {children}
          </LockStoreContext.Provider>
        </TaskStoreContext.Provider>
      </TransportStoreContext.Provider>
    </GlobalStateStoreContext.Provider>
  );
}
