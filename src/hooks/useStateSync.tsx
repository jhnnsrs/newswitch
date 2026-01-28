// src/hooks/useStateSync.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { ZodType } from 'zod';
import { useTransport } from '../transport/TransportProvider';

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
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);

  const { fetchState, subscribeToState, getCachedState } = useTransport();
  
  const hasFetchedRef = useRef(false);
  const schemaRef = useRef(definition.schema);
  schemaRef.current = definition.schema;

  // Fetch data from server
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const rawData = await fetchState<unknown>(definition.key);
      
      // Runtime Validation
      const parsed = schemaRef.current.safeParse(rawData);
      if (!parsed.success) {
        console.error(`[${definition.key}] Validation Failed:`, parsed.error);
        setError(new Error(`Validation failed for ${definition.key}`));
      } else {
        setData(parsed.data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchState, definition.key]);

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

  // Subscribe to WebSocket updates if enabled
  useEffect(() => {
    if (!subscribe) return;

    console.log(`[useStateSync] Subscribing to ${definition.key}`);
    
    const unsubscribe = subscribeToState<unknown>(definition.key, (rawValue) => {
      console.log(`[useStateSync] Received update for ${definition.key}:`, rawValue);
      // Runtime Validation
      const parsed = schemaRef.current.safeParse(rawValue);
      if (!parsed.success) {
        console.error(`[${definition.key}] WebSocket Validation Failed:`, parsed.error);
      } else {
        console.log(`[useStateSync] Setting data for ${definition.key}:`, parsed.data);
        setData(parsed.data);
      }
    });

    return () => {
      console.log(`[useStateSync] Unsubscribing from ${definition.key}`);
      unsubscribe();
    };
  }, [subscribe, subscribeToState, definition.key]);

  // Sync with cached state when it changes
  useEffect(() => {
    const cached = getCachedState<unknown>(definition.key);
    if (cached !== undefined) {
      const parsed = schemaRef.current.safeParse(cached);
      if (parsed.success && JSON.stringify(parsed.data) !== JSON.stringify(data)) {
        setData(parsed.data);
      }
    }
  }, [getCachedState, definition.key, data]);

  return { data, loading, error, refetch };
};