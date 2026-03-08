import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import {
  getScopedStateKey,
  getStateDefinitionsRecord,
  resolveStateDefinition,
  type StateDefinition,
} from '@/lib/rekuest/state';
import { useGlobalStateStoreApi } from '@/store';
import { useTransport } from '@/transport/transport-context';
import { StateContext, type StateContextValue } from '@/hooks/state-context';

interface TransportStateResponse<TState> {
  state: TState;
  revision: number;
}

export interface StateProviderProps {
  children: ReactNode;
}

function normalizeError(error: unknown, key: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(`Failed to fetch ${key}`);
}

export function StateProvider({ children }: StateProviderProps) {
  const transport = useTransport();
  const definitions = useMemo(
    () => getStateDefinitionsRecord(transport.apps, transport.defaultAppKey),
    [transport.apps, transport.defaultAppKey],
  );
  const globalStateStoreApi = useGlobalStateStoreApi();
  const inflightRequestsRef = useRef(new Map<string, Promise<unknown>>());

  const refetchState = useCallback(
    async <T extends Record<string, unknown>, TKey extends string>(
      inputDefinition: StateDefinition<T, TKey>,
    ): Promise<T> => {
      const definition = resolveStateDefinition(
        inputDefinition,
        transport.defaultAppKey,
      );
      const scopedKey = getScopedStateKey(definition.appKey, definition.key);
      const existingRequest = inflightRequestsRef.current.get(scopedKey);

      if (existingRequest) {
        return existingRequest as Promise<T>;
      }

      const store = globalStateStoreApi.getState();
      store.setLoading(scopedKey, true);
      store.setError(scopedKey, null);

      const request = transport
        .fetchState<TransportStateResponse<T>>(definition.appKey, definition.key)
        .then((response) => {
          const parsed = definition.schema.safeParse(response.state);

          if (!parsed.success) {
            console.error(`[StateProvider] Validation failed for ${scopedKey}`, {
              error: parsed.error,
              value: response.state,
            });

            throw new Error(`Validation failed for ${scopedKey}`);
          }

          globalStateStoreApi
            .getState()
            .setStateSnapshot(
              scopedKey,
              parsed.data as T,
              response.revision ?? 0,
            );

          return parsed.data as T;
        })
        .catch((error) => {
          const normalizedError = normalizeError(error, scopedKey);
          globalStateStoreApi.getState().setError(scopedKey, normalizedError);
          throw normalizedError;
        })
        .finally(() => {
          inflightRequestsRef.current.delete(scopedKey);
          globalStateStoreApi.getState().setLoading(scopedKey, false);
        });

      inflightRequestsRef.current.set(scopedKey, request);

      return request;
    },
    [globalStateStoreApi, transport],
  );

  const ensureState = useCallback(
    async <T extends Record<string, unknown>, TKey extends string>(
      definition: StateDefinition<T, TKey>,
    ): Promise<void> => {
      const resolvedDefinition = resolveStateDefinition(
        definition,
        transport.defaultAppKey,
      );
      const scopedKey = getScopedStateKey(
        resolvedDefinition.appKey,
        resolvedDefinition.key,
      );
      const currentState = globalStateStoreApi.getState().getState(scopedKey);

      if (currentState !== undefined) {
        return;
      }

      await refetchState(resolvedDefinition);
    },
    [globalStateStoreApi, refetchState, transport.defaultAppKey],
  );

  const value = useMemo<StateContextValue>(
    () => ({
      definitions,
      ensureState,
      refetchState,
    }),
    [definitions, ensureState, refetchState],
  );

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}
