import { useCallback, useEffect } from 'react';
import {
  selectError,
  selectLoading,
  selectState,
  useGlobalStateStore,
} from '@/store';
import { useTransport } from '@/transport/transport-context';
import { useStateContext } from '@/hooks/state-context';
import { getScopedStateKey, resolveStateAppKey } from './definitions';
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
  const scopedStateKey = getScopedStateKey(appKey, definition.key);

  const rawData = useGlobalStateStore(selectState<T>(scopedStateKey)) ?? null;
  const revision = useGlobalStateStore(
    (state) => state.stateRevisions[scopedStateKey] ?? 0,
  );

  const data =
    rawData && selector ? selector(rawData) : (rawData as unknown as U | null);

  const loading = useGlobalStateStore(selectLoading(scopedStateKey));
  const error = useGlobalStateStore(selectError(scopedStateKey));

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
