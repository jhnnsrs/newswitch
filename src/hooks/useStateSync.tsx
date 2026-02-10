// src/hooks/useStateSync.ts
import { useEffect, useCallback, useRef } from 'react';
import { ZodType } from 'zod';
import { useTransport } from '../transport/TransportProvider';
import { useGlobalStateStore, selectState, selectLoading, selectError } from '../store';

// --- Interfaces ---

export interface StateDefinition<T> {
  key: string;
  schema: ZodType<T>;
}

export interface UseStateSyncOptions<T, U = T> {
  subscribe?: boolean;
  fetchOnMount?: boolean;
  selector?: (state: T) => U;
}

export interface UseStateSyncResult<U> {
  data: U | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// --- The Factory Function ---

/**
 * Creates a dedicated hook for a specific state definition.
 * The generic <U> is applied to the returned function, allowing the selector
 * to determine the return type at the call-site.
 */
export const buildUseState = <T extends Record<string, unknown>>(
  definition: StateDefinition<T>
) => {
  return <U = T>(options: UseStateSyncOptions<T, U> = {}): UseStateSyncResult<U> => {
    return useStateSync<T, U>(definition, options);
  };
};

// --- The Core Hook ---

export const useStateSync = <T extends Record<string, unknown>, U = T>(
  definition: StateDefinition<T>,
  options: UseStateSyncOptions<T, U> = {}
): UseStateSyncResult<U> => {
  const { subscribe = false, fetchOnMount = true, selector } = options;

  // 1. Get raw state
  const rawData = useGlobalStateStore(selectState<T>(definition.key)) ?? null;

  // 2. Apply selector logic
  // If rawData exists and selector exists, use selector.
  // Otherwise, cast rawData to U (which is safe because U defaults to T if no selector).
  const data = (rawData && selector) 
    ? selector(rawData) 
    : (rawData as unknown as U | null);

  const loading = useGlobalStateStore(selectLoading(definition.key));
  const error = useGlobalStateStore(selectError(definition.key));

  const { setState, setLoading, setError } = useGlobalStateStore();
  const { fetchState } = useTransport();

  const hasFetchedRef = useRef(false);
  // Keep schema ref stable
  const schemaRef = useRef(definition.schema);

  const fetchData = useCallback(async () => {
    try {
      setLoading(definition.key, true);
      setError(definition.key, null);

      // Just fetch; the store update happens via setState
      const response = await fetchState<{ state: T; revision: number }>(definition.key);

      const parsed = schemaRef.current.safeParse(response.state);
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

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (fetchOnMount && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [fetchOnMount, fetchData]);

  useEffect(() => {
    if (subscribe) {
      console.log(`[useStateSync] Subscribing to ${definition.key}`);
    }
    return () => {
      if (subscribe) {
        console.log(`[useStateSync] Unsubscribing from ${definition.key}`);
      }
    };
  }, [subscribe, definition.key]);

  return { data, loading, error, refetch };
};