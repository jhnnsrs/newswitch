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

export interface RekuestStoreBundle {
  globalStateStore: ReturnType<typeof createGlobalStateStoreRegistry>;
  taskStore: ReturnType<typeof createTaskStoreRegistry>;
  transportStore: ReturnType<typeof createTransportStore>;
  lockStore: ReturnType<typeof createLockStoreRegistry>;
}

export interface RekuestStoreProviderProps {
  children: ReactNode;
  scope?: string;
  debug?: boolean;
}

const scopedBundles = new Map<string, RekuestStoreBundle>();

const createRekuestStoreBundle = (debug = false): RekuestStoreBundle => {
  const transportStore = createTransportStore();

  return {
    globalStateStore: createGlobalStateStoreRegistry({ debug }),
    taskStore: createTaskStoreRegistry(transportStore, { debug }),
    transportStore,
    lockStore: createLockStoreRegistry({ debug }),
  };
};

const getScopedBundle = (scope: string, debug = false): RekuestStoreBundle => {
  const bundleKey = `${scope}::debug-${debug ? 'on' : 'off'}`;
  const existingBundle = scopedBundles.get(bundleKey);

  if (existingBundle) {
    return existingBundle;
  }

  const nextBundle = createRekuestStoreBundle(debug);
  scopedBundles.set(bundleKey, nextBundle);
  return nextBundle;
};

export function RekuestStoreProvider({
  children,
  scope = 'default',
  debug = false,
}: RekuestStoreProviderProps) {
  const stores = useMemo(() => getScopedBundle(scope, debug), [debug, scope]);

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
