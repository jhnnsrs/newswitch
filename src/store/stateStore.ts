// src/store/stateStore.ts
import { applyPatch, type Operation } from "fast-json-patch";
import type { GlobalStateKey, GlobalStateShape } from "@/hooks/states";
import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createScopedStoreHooks } from "./createScopedStore";

type GlobalStateRecord = Partial<GlobalStateShape> & Record<string, unknown>;
type StateMetaRecord<TValue> = Partial<Record<GlobalStateKey, TValue>> &
  Record<string, TValue | undefined>;

export interface Envelope {
  state_name: string;
  rev: number;
  base_rev: number;
  ts: number;
  patches: Operation[];
}

// State shape: { [stateName]: stateValue }
export interface GlobalStateStore {
  /** All states keyed by their name */
  states: GlobalStateRecord;
  stateRevisions: StateMetaRecord<number>;

  /** Loading states for each key */
  loading: StateMetaRecord<boolean>;

  locks: Record<string, string | undefined>;

  /** Error states for each key */
  errors: StateMetaRecord<Error | null>;

  /** Set a state value */
  setState: {
    <TKey extends GlobalStateKey>(
      key: TKey,
      value: GlobalStateShape[TKey],
    ): void;
    (key: string, value: unknown): void;
  };

  setLock: (key: string, value: string | undefined) => void;

  /** Apply a JSON patch to a state (RFC 6902 format) */
  applyEnvelope: (envelope: Envelope) => void;

  /** Set loading state */
  setLoading: (key: GlobalStateKey | string, loading: boolean) => void;

  /** Set error state */
  setError: (key: GlobalStateKey | string, error: Error | null) => void;

  /** Get a specific state value */
  getState: {
    <TKey extends GlobalStateKey>(key: TKey): GlobalStateShape[TKey] | undefined;
    <T = unknown>(key: string): T | undefined;
  };

  /** Clear a state */
  clearState: (key: GlobalStateKey | string) => void;

  /** Clear all states */
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
      locks: {},

      setState: (key: string, value: unknown) => {
        set((state) => {
          state.states[key] = value;
          state.errors[key] = null;
          state.stateRevisions[key] = 0;
        });
      },

      setLock: (key, value) => {
        set((state) => {
          state.locks[key] = value;
        });
      },

      applyEnvelope: (envelope: Envelope) => {
        const { state_name: key, patches: operations } = envelope;
        const currentState = get().states[key];
        const currentRevision = get().stateRevisions[key] ?? 0;
        if (currentState === undefined) {
          console.warn(
            `[StateStore] Cannot apply patch to unknown state: ${key}`,
          );
          return;
        }
        if (envelope.base_rev !== currentRevision) {
          console.warn(
            `[StateStore] Revision mismatch for ${key}: current=${currentRevision}, envelope.base_rev=${envelope.base_rev}`,
          );
          // In a real implementation, we would need to fetch the latest state and rebase the patch
          // For now, we will just log a warning and skip applying the patch
        }

        try {
          // Clone the current state and apply JSON patches using fast-json-patch
          const clonedState = JSON.parse(JSON.stringify(currentState));
          const { newDocument } = applyPatch(clonedState, operations);

          // Set the new state (this triggers Zustand subscribers)
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
>("GlobalStateStore");

export { GlobalStateStoreContext, useGlobalStateStore, useGlobalStateStoreApi };

// Selector helpers for subscribing to specific state paths
export function selectState<TKey extends GlobalStateKey>(
  key: TKey,
): (store: GlobalStateStore) => GlobalStateShape[TKey] | undefined;
export function selectState<T = unknown>(
  key: string,
): (store: GlobalStateStore) => T | undefined;
export function selectState(key: string) {
  return (store: GlobalStateStore) => store.states[key];
}

export const selectLock =
  <T = unknown>(key: string) =>
  (store: GlobalStateStore) =>
    store.locks[key] as T | undefined;

export const selectLoading = (key: string) => (store: GlobalStateStore) =>
  store.loading[key] ?? false;

export const selectError = (key: string) => (store: GlobalStateStore) =>
  store.errors[key] ?? null;

// Deep path selector - subscribe to nested paths like "CameraState.exposure_time"
export const selectPath = <T = unknown>(path: string) => {
  const parts = path.split(".");
  return (store: GlobalStateStore): T | undefined => {
    let current: unknown = store.states;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current as T | undefined;
  };
};
