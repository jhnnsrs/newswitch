import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import { applyPatch, type Operation } from 'fast-json-patch';
import { createStore, type StateCreator, type StoreApi } from 'zustand/vanilla';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Envelope {
  state_name: string;
  rev: number;
  base_rev: number;
  ts: number;
  patches: Operation[];
}

export interface PatchSegment {
  from_global_rev: number;
  to_global_rev: number;
  patches: Operation[];
}

export interface StateSnapshot {
  name: string;
  value: unknown;
  revision: number;
}

export interface SnapshotEnvelope {
  revision: string;
  state_snapshots: StateSnapshot[];
}

export interface GlobalStateStore {


  states: Record<string, unknown>;
  stateRevisions: Record<string, number | undefined>;
  globalRevision: number;
  latestPatches: Operation[],

  isLive: boolean;
  segments: PatchSegment[];
  snapshots: SnapshotEnvelope[];

  loading: Record<string, boolean | undefined>;
  errors: Record<string, Error | null | undefined>;


  setIsLive: (isLive: boolean) => void;
  setState: (key: string, value: unknown) => void;
  setStateSnapshot: (key: string, value: unknown, revision: number) => void;
  setStateSnapshots: (
    snapshots: Record<string, { value: unknown; revision: number }>,
  ) => void;
  applyEnvelope: (envelope: Envelope) => void;
  setLoading: (key: string, loading: boolean) => void;
  setGlobalRevision: (revision: number) => void;
  setError: (key: string, error: Error | null) => void;
  getState: <T = unknown>(key: string) => T | undefined;
  clearState: (key: string) => void;
  clearAll: () => void;
}

interface GlobalStateStoreOptions {
  debug?: boolean;
  devtoolsName?: string;
}

export const createGlobalStateStore = ({
  debug = false,
  devtoolsName = 'RekuestStateStore',
}: GlobalStateStoreOptions = {}) => {
  const initializer: StateCreator<
    GlobalStateStore,
    [],
    [['zustand/subscribeWithSelector', never], ['zustand/immer', never]]
  > = subscribeWithSelector(
    immer((set, get) => ({
        states: {},
        stateRevisions: {},
        loading: {},
        isLive: false,
        segments: [],
        snapshots: [],
        errors: {},
        latestPatches: [],
        globalRevision: 0,
        setIsLive: (isLive) => {
          set((state) => {
            state.isLive = isLive;
          });
        },
        setGlobalRevision: (revision) => {
          set((state) => {
            state.globalRevision = revision;
          });
        },
        setState: (key, value) => {
          set((state) => {
            state.states[key] = value;
            state.errors[key] = null;
            state.stateRevisions[key] = 0;
          });
        },

        setStateSnapshot: (key, value, revision) => {
          set((state) => {
            state.states[key] = value;
            state.errors[key] = null;
            state.stateRevisions[key] = revision;
          });
        },

        setStateSnapshots: (snapshots) => {
          set((state) => {
            for (const [key, snapshot] of Object.entries(snapshots)) {
              state.states[key] = snapshot.value;
              state.errors[key] = null;
              state.stateRevisions[key] = snapshot.revision;
            }
          });
        },

        applyEnvelope: (envelope) => {
          const { state_name: key, patches: operations } = envelope;
          const currentState = get().states[key];
          const currentRevision = get().stateRevisions[key] ?? 0;
          if (currentState === undefined) {
            console.warn(`[StateStore] Cannot apply patch to unknown state: ${key}`);
            return;
          }
          if (envelope.base_rev !== currentRevision) {
            console.warn(
              `[StateStore] Revision mismatch for ${key}: current=${currentRevision}, envelope.base_rev=${envelope.base_rev}`,
            );
          }

          set((state) => {
            state.latestPatches.push(...operations)
          });

          try {
            const clonedState = JSON.parse(JSON.stringify(currentState));
            const { newDocument } = applyPatch(clonedState, operations);
            

            set((state) => {
              state.states[key] = newDocument;
              state.stateRevisions[key] = envelope.rev;
            });
          } catch (err) {
            console.error(`[StateStore] Failed to apply patch to ${key}:`, err);
          }
        },

        setLoading: (key, loading) => {
          set((state) => {
            state.loading[key] = loading;
          });
        },

        setError: (key, error) => {
          set((state) => {
            state.errors[key] = error;
          });
        },

        getState: <T = unknown>(key: string) => {
          return get().states[key] as T | undefined;
        },

        clearState: (key) => {
          set((state) => {
            delete state.states[key];
            delete state.loading[key];
            delete state.errors[key];
            delete state.stateRevisions[key];
          });
        },

        clearAll: () => {
          set((state) => {
            state.states = {};
            state.loading = {};
            state.errors = {};
            state.stateRevisions = {};
          });
        },
      })),
  );

  if (debug) {
    return createStore<GlobalStateStore>()(
      devtools(initializer, { name: devtoolsName }),
    );
  }

  return createStore<GlobalStateStore>()(initializer);
};

interface GlobalStateStoreRegistryOptions {
  debug?: boolean;
}

export interface GlobalStateStoreRegistry {
  getStoreApi: (appKey: string) => StoreApi<GlobalStateStore>;
  getStoreEntries: () => Array<[string, StoreApi<GlobalStateStore>]>;
}

export const createGlobalStateStoreRegistry = ({
  debug = false,
}: GlobalStateStoreRegistryOptions = {}): GlobalStateStoreRegistry => {
  const stores = new Map<string, StoreApi<GlobalStateStore>>();

  const getStoreApi = (appKey: string) => {
    const existingStore = stores.get(appKey);
    if (existingStore) {
      return existingStore;
    }

    const nextStore = createGlobalStateStore({
      debug,
      devtoolsName: `RekuestStateStore/${appKey}`,
    });
    stores.set(appKey, nextStore);
    return nextStore;
  };

  return {
    getStoreApi,
    getStoreEntries: () => Array.from(stores.entries()),
  };
};

export const GlobalStateStoreContext = createContext<GlobalStateStoreRegistry | null>(
  null,
);

export const useGlobalStateStoreRegistry = (): GlobalStateStoreRegistry => {
  const registry = useContext(GlobalStateStoreContext);

  if (!registry) {
    throw new Error('Missing GlobalStateStoreProvider');
  }

  return registry;
};

export function useGlobalStateStoreApi(appKey: string) {
  return useGlobalStateStoreRegistry().getStoreApi(appKey);
}

export function useGlobalStateStore<TSelected>(
  appKey: string,
  selector: (state: GlobalStateStore) => TSelected,
): TSelected;
export function useGlobalStateStore<TSelected>(
  appKey: string,
  selector: (state: GlobalStateStore) => TSelected,
): TSelected {
  const registry = useGlobalStateStoreRegistry();

  if (!selector) {
    throw new Error('Missing state selector');
  }

  return useStore(registry.getStoreApi(appKey), selector);
}

export const selectState = <T = unknown>(key: string) =>
  (store: GlobalStateStore): T | undefined =>
    store.states[key] as T | undefined;

export const selectRevision = (key: string) =>
  (store: GlobalStateStore): number =>
    store.stateRevisions[key] ?? 0;

export const selectLoading = (key: string) => (store: GlobalStateStore) =>
  store.loading[key] ?? false;

export const selectError = (key: string) => (store: GlobalStateStore) =>
  store.errors[key] ?? null;

export const selectPath = <T = unknown>(path: string) => {
  const parts = path.split('.');
  return (store: GlobalStateStore): T | undefined => {
    let current: unknown = store.states;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current as T | undefined;
  };
};
