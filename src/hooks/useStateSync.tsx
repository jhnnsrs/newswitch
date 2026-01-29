// src/hooks/useStateSync.ts
import { useEffect, useCallback, useRef } from 'react';
import { ZodType } from 'zod';
import { useTransport } from '../transport/TransportProvider';
import { useGlobalStateStore, selectState, selectLoading, selectError } from '../store';

// --- The Definition Interface ---
export interface StateDefinition<T> {
  key: string;          // e.g. "StageState"
  schema: ZodType<T>;
}

export interface UseStateSyncOptions {
  /** Whether to subscribe to real-time updates via WebSocket (default: false) */
  subscribe?: boolean;
  /** Whether to fetch the initial state on mount (default: true) */
  fetchOnMount?: boolean;
}

export interface UseStateSyncResult<T> {
  /** The current state data */
  data: T | null;
  /** Whether the initial fetch is loading */
  loading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Manually refetch the state from the server */
  refetch: () => Promise<void>;
}

export const useStateSync = <T extends Record<string, unknown>>(
  definition: StateDefinition<T>,
  options: UseStateSyncOptions = {}
): UseStateSyncResult<T> => {
  const { subscribe = false, fetchOnMount = true } = options;
  
  // Use Zustand selectors for state subscription
  // Direct selector without useShallow - Zustand will properly detect changes
  const data = useGlobalStateStore(selectState<T>(definition.key)) ?? null;
  const loading = useGlobalStateStore(selectLoading(definition.key));
  const error = useGlobalStateStore(selectError(definition.key));
  
  // Get store actions
  const { setState, setLoading, setError } = useGlobalStateStore();
  
  // Get transport for fetching
  const { fetchState } = useTransport();
  
  const hasFetchedRef = useRef(false);
  const schemaRef = useRef(definition.schema);
  schemaRef.current = definition.schema;

  // Fetch data from server
  const fetchData = useCallback(async () => {
    try {
      setLoading(definition.key, true);
      setError(definition.key, null);
      
      const rawData = await fetchState<unknown>(definition.key);
      
      // Runtime Validation
      const parsed = schemaRef.current.safeParse(rawData);
      if (!parsed.success) {
        console.error(`[${definition.key}] Validation Failed:`, parsed.error);
        setError(definition.key, new Error(`Validation failed for ${definition.key}`));
      } else {
        setState(definition.key, parsed.data);
      }
    } catch (err) {
      setError(definition.key, err as Error);
    } finally {
      setLoading(definition.key, false);
    }
  }, [fetchState, definition.key, setState, setLoading, setError]);

  // Refetch function exposed to consumers
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Fetch on mount if enabled (runs only once)
  useEffect(() => {
    if (fetchOnMount && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [fetchOnMount, fetchData]);

  // Subscribe effect - just for logging/debugging, actual updates come through the store
  useEffect(() => {
    if (subscribe) {
      console.log(`[useStateSync] Component subscribed to ${definition.key}`);
    }
    return () => {
      if (subscribe) {
        console.log(`[useStateSync] Component unsubscribed from ${definition.key}`);
      }
    };
  }, [subscribe, definition.key]);

  return { data, loading, error, refetch };
};