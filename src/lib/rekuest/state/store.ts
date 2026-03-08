import { applyPatch, type Operation } from 'fast-json-patch';
import { createStore } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createScopedStoreHooks } from '@/lib/rekuest/createScopedStore';

type GlobalStateRecord = Record<string, unknown>;
type StateMetaRecord<TValue> = Record<string, TValue | undefined>;

export interface Envelope {
  state_name: string;
  rev: number;
  base_rev: number;
  ts: number;
  patches: Operation[];
}

export interface GlobalStateStore {
  states: GlobalStateRecord;
  stateRevisions: StateMetaRecord<number>;
  loading: StateMetaRecord<boolean>;
  errors: StateMetaRecord<Error | null>;
  setState: (key: string, value: unknown) => void;
  setStateSnapshot: (key: string, value: unknown, revision: number) => void;
  applyEnvelope: (envelope: Envelope) => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: Error | null) => void;
  getState: <T = unknown>(key: string) => T | undefined;
  clearState: (key: string) => void;
  clearAll: () => void;
}

export const createGlobalStateStore = () =>
  createStore<GlobalStateStore>()(
    subscribeWithSelector(
      immer((set, get) => ({
        states: {},
        stateRevisions: {},
        loading: {},
        errors: {},

        setState: (key: string, value: unknown) => {
          set((state) => {
            state.states[key] = value;
            state.errors[key] = null;
            state.stateRevisions[key] = 0;
          });
        },

        setStateSnapshot: (key: string, value: unknown, revision: number) => {
          set((state) => {
            state.states[key] = value;
            state.errors[key] = null;
            state.stateRevisions[key] = revision;
          });
        },

        applyEnvelope: (envelope: Envelope) => {
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
          });
        },

        clearAll: () => {
          set((state) => {
            state.states = {};
            state.loading = {};
            state.errors = {};
          });
        },
      })),
    ),
  );

const {
  StoreContext: GlobalStateStoreContext,
  useScopedStore: useGlobalStateStore,
  useStoreApi: useGlobalStateStoreApi,
} = createScopedStoreHooks<
  GlobalStateStore,
  ReturnType<typeof createGlobalStateStore>
>('GlobalStateStore');

export { GlobalStateStoreContext, useGlobalStateStore, useGlobalStateStoreApi };

export const selectState = <T = unknown>(key: string) =>
  (store: GlobalStateStore): T | undefined =>
    store.states[key] as T | undefined;

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
