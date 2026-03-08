// src/hooks/useStateSync.ts
import { useCallback, useEffect } from "react";
import { ZodType } from "zod";
import {
  selectError,
  selectLoading,
  selectState,
  useGlobalStateStore,
} from "../store";
import { useStateContext } from "./state-context";

// --- Interfaces ---

export interface StateDefinition<T, TKey extends string = string> {
  key: TKey;
  schema: ZodType<T>;
}

export interface UseStateSyncOptions<T, U = T> {
  subscribe?: boolean;
  fetchOnMount?: boolean;
  selector?: (state: T) => U;
}

export interface UseStateSyncResult<U> {
  data?: U | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  revision: number;
}

// --- The Factory Function ---

/**
 * Creates a dedicated hook for a specific state definition.
 * The generic <U> is applied to the returned function, allowing the selector
 * to determine the return type at the call-site.
 */
export const buildUseState = <T extends Record<string, unknown>>(
  definition: StateDefinition<T>,
) => {
  return <U = T,>(
    options: UseStateSyncOptions<T, U> = {},
  ): UseStateSyncResult<U> => {
    return useStateSync<T, U>(definition, options);
  };
};

// --- The Core Hook ---

export const useStateSync = <
  T extends Record<string, unknown>,
  U = T,
  TKey extends string = string,
>(
  definition: StateDefinition<T, TKey>,
  options: UseStateSyncOptions<T, U> = {},
): UseStateSyncResult<U> => {
  const { subscribe = false, fetchOnMount = true, selector } = options;
  const stateContext = useStateContext();
  void subscribe;
  const stateKey = definition.key as keyof typeof stateContext.definitions;

  const rawData = useGlobalStateStore(selectState<T>(definition.key)) ?? null;
  const revision = useGlobalStateStore((state) => state.stateRevisions[definition.key] ?? 0);

  const data =
    rawData && selector ? selector(rawData) : (rawData as unknown as U | null);

  const loading = useGlobalStateStore(selectLoading(definition.key));
  const error = useGlobalStateStore(selectError(definition.key));

  const refetch = useCallback(async () => {
    await stateContext.refetchState(stateKey);
  }, [stateContext, stateKey]);

  useEffect(() => {
    if (fetchOnMount) {
      void stateContext.ensureState(stateKey);
    }
  }, [fetchOnMount, stateContext, stateKey]);

  return { data, loading, error, refetch, revision };
};
