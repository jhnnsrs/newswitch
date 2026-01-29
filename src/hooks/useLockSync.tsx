// src/hooks/useStateSync.ts
import { useCallback, useEffect, useRef } from 'react';
import { selectError, selectLoading, selectState, useGlobalStateStore } from '../store';
import { useTransport } from '../transport/TransportProvider';
import { selectLock } from '@/store/stateStore';

// --- The Definition Interface ---
export interface LockDefinition<T extends string> {
  key: T;          
}

export interface UseLockSyncOptions {
  /** Whether to subscribe to real-time updates via WebSocket (default: false) */
  subscribe?: boolean;
  /** Whether to fetch the initial state on mount (default: true) */
  fetchOnMount?: boolean;
}

export interface UseLockSyncResult {
  /** The current state data */
  lockingTaskId: string | undefined;
}

export const useLockSync = <T extends string>(
  definition: LockDefinition<T>,
  options: UseLockSyncOptions = {}
): string | undefined => {
  
  // Use Zustand selectors for state subscription
  // Direct selector without useShallow - Zustand will properly detect changes
  const lockingTaskId = useGlobalStateStore(selectLock<T>(definition.key)) ?? undefined;
  

  return lockingTaskId;
};