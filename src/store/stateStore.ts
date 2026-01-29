// src/store/stateStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { applyPatch, type Operation } from 'fast-json-patch';

// State shape: { [stateName]: stateValue }
export interface GlobalStateStore {
  /** All states keyed by their name */
  states: Record<string, unknown>;
  
  /** Loading states for each key */
  loading: Record<string, boolean>;
  
  /** Error states for each key */
  errors: Record<string, Error | null>;
  
  /** Set a state value */
  setState: (key: string, value: unknown) => void;
  
  /** Apply a JSON patch to a state (RFC 6902 format) */
  applyJsonPatch: (key: string, operations: Operation[]) => void;
  
  /** Set loading state */
  setLoading: (key: string, loading: boolean) => void;
  
  /** Set error state */
  setError: (key: string, error: Error | null) => void;
  
  /** Get a specific state value */
  getState: <T = unknown>(key: string) => T | undefined;
  
  /** Clear a state */
  clearState: (key: string) => void;
  
  /** Clear all states */
  clearAll: () => void;
}

export const useGlobalStateStore = create<GlobalStateStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      states: {},
      loading: {},
      errors: {},
      
      setState: (key, value) => {
        set((state) => {
          state.states[key] = value;
          state.errors[key] = null;
        });
      },
      
      applyJsonPatch: (key, operations) => {
        const currentState = get().states[key];
        if (currentState === undefined) {
          console.warn(`[StateStore] Cannot apply patch to unknown state: ${key}`);
          return;
        }
        
        try {
          // Clone the current state and apply JSON patches using fast-json-patch
          const clonedState = JSON.parse(JSON.stringify(currentState));
          const { newDocument } = applyPatch(clonedState, operations);
          
          console.log(`[StateStore] Applied patch to ${key}:`, operations, '-> Result:', newDocument);
          
          // Set the new state (this triggers Zustand subscribers)
          set((state) => {
            state.states[key] = newDocument;
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
    }))
  )
);

// Selector helpers for subscribing to specific state paths
export const selectState = <T = unknown>(key: string) => 
  (store: GlobalStateStore) => store.states[key] as T | undefined;

export const selectLoading = (key: string) => 
  (store: GlobalStateStore) => store.loading[key] ?? false;

export const selectError = (key: string) => 
  (store: GlobalStateStore) => store.errors[key] ?? null;

// Deep path selector - subscribe to nested paths like "CameraState.exposure_time"
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
