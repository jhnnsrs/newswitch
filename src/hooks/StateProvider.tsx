import type { ReactNode } from "react";
import { useCallback, useMemo, useRef } from "react";
import { useGlobalStateStoreApi } from "../store";
import { useTransport } from "../transport/transport-context";
import { StateContext, type StateContextValue } from "./state-context";
import { type GlobalStateKey, type GlobalStateShape } from "./states";

interface TransportStateResponse<TState> {
  state: TState;
  revision: number;
}

interface StateProviderProps {
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
  const definitions = transport.app.states;
  const globalStateStoreApi = useGlobalStateStoreApi();
  const inflightRequestsRef = useRef(new Map<string, Promise<unknown>>());

  const refetchState = useCallback(
    async <TKey extends GlobalStateKey>(
      key: TKey,
    ): Promise<GlobalStateShape[TKey]> => {
      const existingRequest = inflightRequestsRef.current.get(key);

      if (existingRequest) {
        return existingRequest as Promise<GlobalStateShape[TKey]>;
      }

      const definition = definitions[key];

      if (!definition) {
        throw new Error(`No state definition registered for ${key}`);
      }

      const store = globalStateStoreApi.getState();
      store.setLoading(key, true);
      store.setError(key, null);

      const request = transport
        .fetchState<TransportStateResponse<GlobalStateShape[TKey]>>(key)
        .then((response) => {
          const parsed = definition.schema.safeParse(response.state);

          if (!parsed.success) {
            console.error(`[StateProvider] Validation failed for ${key}`, {
              error: parsed.error,
              value: response.state,
            });

            throw new Error(`Validation failed for ${key}`);
          }

          globalStateStoreApi
            .getState()
            .setStateSnapshot(
              key,
              parsed.data as GlobalStateShape[TKey],
              response.revision ?? 0,
            );

          return parsed.data as GlobalStateShape[TKey];
        })
        .catch((error) => {
          const normalizedError = normalizeError(error, key);
          globalStateStoreApi.getState().setError(key, normalizedError);
          throw normalizedError;
        })
        .finally(() => {
          inflightRequestsRef.current.delete(key);
          globalStateStoreApi.getState().setLoading(key, false);
        });

      inflightRequestsRef.current.set(key, request);

      return request;
    },
    [definitions, globalStateStoreApi, transport],
  );

  const ensureState = useCallback(
    async <TKey extends GlobalStateKey>(key: TKey): Promise<void> => {
      const currentState = globalStateStoreApi.getState().getState(key);

      if (currentState !== undefined) {
        return;
      }

      await refetchState(key);
    },
    [globalStateStoreApi, refetchState],
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