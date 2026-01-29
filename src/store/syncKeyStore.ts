// src/store/syncKeyStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

export interface SyncKeyState {
  /** The local reference for tracking */
  reference: string;
  /** The task ID once assigned (may be set later) */
  taskId?: string;
}

export interface SyncKeyStore {
  /** Map of syncKey to active reference/task info */
  syncKeys: Record<string, SyncKeyState>;

  /** Set active reference for a sync key (before assignment) */
  setSyncKeyReference: (syncKey: string, reference: string) => void;

  /** Update the task ID for a sync key reference */
  setSyncKeyTaskId: (syncKey: string, taskId: string) => void;

  /** Clear sync key (when task completes/fails/cancels) */
  clearSyncKey: (syncKey: string) => void;

  /** Clear sync key by reference */
  clearSyncKeyByReference: (reference: string) => void;

  /** Get active reference for a sync key */
  getSyncKeyReference: (syncKey: string) => string | undefined;

  /** Get active task ID for a sync key */
  getSyncKeyTaskId: (syncKey: string) => string | undefined;

  /** Check if sync key is active */
  isSyncKeyActive: (syncKey: string) => boolean;
}

export const useSyncKeyStore = create<SyncKeyStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      syncKeys: {},

      setSyncKeyReference: (syncKey, reference) => {
        set((state) => {
          state.syncKeys[syncKey] = { reference };
        });
      },

      setSyncKeyTaskId: (syncKey, taskId) => {
        set((state) => {
          if (state.syncKeys[syncKey]) {
            state.syncKeys[syncKey].taskId = taskId;
          }
        });
      },

      clearSyncKey: (syncKey) => {
        set((state) => {
          delete state.syncKeys[syncKey];
        });
      },

      clearSyncKeyByReference: (reference) => {
        set((state) => {
          const keyToDelete = Object.entries(state.syncKeys).find(
            ([, value]) => value.reference === reference
          )?.[0];
          if (keyToDelete) {
            delete state.syncKeys[keyToDelete];
          }
        });
      },

      getSyncKeyReference: (syncKey) => {
        return get().syncKeys[syncKey]?.reference;
      },

      getSyncKeyTaskId: (syncKey) => {
        return get().syncKeys[syncKey]?.taskId;
      },

      isSyncKeyActive: (syncKey) => {
        return get().syncKeys[syncKey] !== undefined;
      },
    }))
  )
);

// Selectors
export const selectSyncKeyState = (syncKey: string) => 
  (store: SyncKeyStore) => store.syncKeys[syncKey];

export const selectSyncKeyTaskId = (syncKey: string) =>
  (store: SyncKeyStore) => store.syncKeys[syncKey]?.taskId;

export const selectSyncKeyReference = (syncKey: string) =>
  (store: SyncKeyStore) => store.syncKeys[syncKey]?.reference;

export const selectIsSyncKeyActive = (syncKey: string) =>
  (store: SyncKeyStore) => store.syncKeys[syncKey] !== undefined;
