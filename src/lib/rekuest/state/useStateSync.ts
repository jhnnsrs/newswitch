import { useCallback, useEffect } from 'react';
import {
  selectError,
  selectLoading,
  selectRevision,
  selectState,
  useGlobalStateStore,
} from './store';
import { useTransport } from '@/transport/transport-context';
import { useStateContext } from '@/hooks/state-context';
import { resolveStateAppKey } from './definitions';
import type {
  StateDefinition,
  UseStateSyncOptions,
  UseStateSyncResult,
} from './types';

export const buildUseState = <T extends Record<string, unknown>>(
  definition: StateDefinition<T>,
) => {
  return <U = T,>(
    options: UseStateSyncOptions<T, U> = {},
  ): UseStateSyncResult<U> => {
    return useStateSync<T, U>(definition, options);
  };
};

export const useStateSync = <
  T extends Record<string, unknown>,
  U = T,
  TKey extends string = string,
>(
  definition: StateDefinition<T, TKey>,
  options: UseStateSyncOptions<T, U> = {},
): UseStateSyncResult<U> => {
  const { subscribe = false, fetchOnMount = true, selector } = options;
  const transport = useTransport();
  const stateContext = useStateContext();
  void subscribe;

  const appKey = resolveStateAppKey(definition, transport.defaultAppKey);

  const rawData = useGlobalStateStore(appKey, selectState<T>(definition.key)) ?? null;
  const revision = useGlobalStateStore(appKey, selectRevision(definition.key));

  const data =
    rawData && selector ? selector(rawData) : (rawData as unknown as U | null);

  const loading = useGlobalStateStore(appKey, selectLoading(definition.key));
  const error = useGlobalStateStore(appKey, selectError(definition.key));

  const refetch = useCallback(async () => {
    await stateContext.refetchState(definition);
  }, [definition, stateContext]);

  useEffect(() => {
    if (fetchOnMount) {
      void stateContext.ensureState(definition);
    }
  }, [definition, fetchOnMount, stateContext]);

  return { data, loading, error, refetch, revision };
};
