import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import {
  getStateDefinitionsRecord,
  resolveStateDefinition,
  type StateDefinition,
} from '@/lib/rekuest/state';
import { useGlobalStateStoreRegistry } from '@/lib/rekuest/state/store';
import { useTransport } from '@/lib/rekuest/transport/transport-context';
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
  type TransportAppKey = Parameters<typeof transport.fetchState>[0];
  const definitions = useMemo(
    () => getStateDefinitionsRecord(transport.apps, transport.defaultAppKey),
    [transport.apps, transport.defaultAppKey],
  );
  const globalStateStoreRegistry = useGlobalStateStoreRegistry();
  const inflightRequestsRef = useRef(new Map<string, Promise<unknown>>());

  const refetchState = useCallback(
    async <T extends Record<string, unknown>, TKey extends string>(
      inputDefinition: StateDefinition<T, TKey>,
    ): Promise<T> => {
      const definition = resolveStateDefinition(
        inputDefinition,
        transport.defaultAppKey,
      );
      const requestKey = `${definition.appKey}::${definition.key}`;
      const existingRequest = inflightRequestsRef.current.get(requestKey);

      if (existingRequest) {
        return existingRequest as Promise<T>;
      }

      const storeApi = globalStateStoreRegistry.getStoreApi(definition.appKey);
      const store = storeApi.getState();
      store.setLoading(definition.key, true);
      store.setError(definition.key, null);

      const request = transport
        .fetchState<TransportStateResponse<T>>(
          definition.appKey as TransportAppKey,
          definition.key,
        )
        .then((response) => {
          const parsed = definition.schema.safeParse(response.state);

          if (!parsed.success) {
            console.error(`[StateProvider] Validation failed for ${definition.appKey}.${definition.key}`, {
              error: parsed.error,
              value: response.state,
            });

            throw new Error(`Validation failed for ${definition.appKey}.${definition.key}`);
          }

          storeApi.getState().setStateSnapshot(
            definition.key,
            parsed.data as T,
            response.revision ?? 0,
          );

          return parsed.data as T;
        })
        .catch((error) => {
          const normalizedError = normalizeError(
            error,
            `${definition.appKey}.${definition.key}`,
          );
          storeApi.getState().setError(definition.key, normalizedError);
          throw normalizedError;
        })
        .finally(() => {
          inflightRequestsRef.current.delete(requestKey);
          storeApi.getState().setLoading(definition.key, false);
        });

      inflightRequestsRef.current.set(requestKey, request);

      return request;
    },
    [globalStateStoreRegistry, transport],
  );

  const ensureState = useCallback(
    async <T extends Record<string, unknown>, TKey extends string>(
      definition: StateDefinition<T, TKey>,
    ): Promise<void> => {
      const resolvedDefinition = resolveStateDefinition(
        definition,
        transport.defaultAppKey,
      );
      const currentState = globalStateStoreRegistry
        .getStoreApi(resolvedDefinition.appKey)
        .getState()
        .getState(resolvedDefinition.key);

      if (currentState !== undefined) {
        return;
      }

      await refetchState(resolvedDefinition);
    },
    [globalStateStoreRegistry, refetchState, transport.defaultAppKey],
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
