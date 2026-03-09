import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  getScopedStateKey,
  getStateDefinitionsRecord,
  resolveStateDefinition,
  type StateDefinition,
} from '@/lib/rekuest/state';
import type { Envelope as StateStoreEnvelope } from '@/lib/rekuest/state/store';
import { useGlobalStateStoreRegistry } from '@/lib/rekuest/state/store';
import { useTransport } from '@/lib/rekuest/transport/transport-context';
import {
  StateEventType,
  type RevisedStatesSnapshotMap,
  type StateTransportMessage,
  type TransportMessageSubscription,
} from '@/lib/rekuest/transport/types';
import { StateContext, type StateContextValue } from '@/lib/rekuest/state/state-context';

interface TransportStateResponse<TState> {
  state: TState;
  revision: number;
}

type StateProviderAppDefinitions = Record<
  string,
  {
    key: string;
    states: Record<string, StateDefinition<Record<string, unknown>, string>>;
    actions: Record<string, unknown>;
    locks: Record<string, unknown>;
  }
>;

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
  const stateAwareApps = transport.apps as unknown as StateProviderAppDefinitions;
  const definitions = useMemo(
    () => getStateDefinitionsRecord(stateAwareApps),
    [stateAwareApps],
  );
  const globalStateStoreRegistry = useGlobalStateStoreRegistry();
  const inflightRequestsRef = useRef(new Map<string, Promise<unknown>>());
  const subscriptionsRef = useRef(new Map<TransportAppKey, TransportMessageSubscription>());

  const refetchState = useCallback(
    async <T extends Record<string, unknown>, TKey extends string>(
      inputDefinition: StateDefinition<T, TKey>,
    ): Promise<T> => {
      const definition = resolveStateDefinition(
        inputDefinition,
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
    [globalStateStoreRegistry, refetchState],
  );

  const handleMessage = useCallback(
    (appKey: TransportAppKey, message: StateTransportMessage) => {
      const store = globalStateStoreRegistry.getStoreApi(appKey).getState();

      switch (message.type) {
        case StateEventType.STATE_UPDATE:
          store.setState(message.state, message.value);
          return;
        case StateEventType.STATE_PATCH:
          store.applyEnvelope(message.envelope as unknown as StateStoreEnvelope);
          return;
      }
    },
    [globalStateStoreRegistry],
  );

  const goLive = useCallback<StateContextValue['goLive']>(
    async (appKey) => {
      const typedAppKey = appKey as TransportAppKey;
      const existing = subscriptionsRef.current.get(typedAppKey);

      if (existing) {
        globalStateStoreRegistry.getStoreApi(typedAppKey).getState().setIsLive(true);
        return;
      }

      const subscription = transport.subscribeToMessages({
        appKey: typedAppKey,
        topic: 'states',
        listener: (message) => handleMessage(typedAppKey, message),
      });

      subscriptionsRef.current.set(typedAppKey, subscription);
      globalStateStoreRegistry.getStoreApi(typedAppKey).getState().setIsLive(true);
    },
    [globalStateStoreRegistry, handleMessage, transport],
  );

  const stopLive = useCallback<StateContextValue['stopLive']>(
    async (appKey) => {
      const typedAppKey = appKey as TransportAppKey;
      subscriptionsRef.current.get(typedAppKey)?.unsubscribe();
      subscriptionsRef.current.delete(typedAppKey);
      globalStateStoreRegistry.getStoreApi(typedAppKey).getState().setIsLive(false);
    },
    [globalStateStoreRegistry],
  );

  const checkout = useCallback<StateContextValue['checkout']>(
    async (appKey, globalRevisionId, options) => {
      const availableDefinitions = Object.values(definitions).filter(
        (definition) => definition.appKey === appKey,
      );
      const stateKeys = options?.stateKeys ?? availableDefinitions.map((definition) => definition.key);

      if (stateKeys.length === 0) {
        return {};
      }

      const storeApi = globalStateStoreRegistry.getStoreApi(appKey);
      const store = storeApi.getState();


      store.setIsLive(false);

      stateKeys.forEach((key) => {
        store.setLoading(key, true);
        store.setError(key, null);
      });

      try {
        const snapshot = await transport.fetchStateCheckout(
          appKey,
          globalRevisionId,
          stateKeys,
        );

        const validatedSnapshots = Object.fromEntries(
          Object.entries(snapshot).map(([stateKey, revisedState]) => {
            const definition = definitions[getScopedStateKey(appKey, stateKey)];

            if (!definition) {
              return [stateKey, revisedState];
            }

            const parsed = definition.schema.safeParse(revisedState.value);

            if (!parsed.success) {
              console.error(
                `[StateProvider] Checkout validation failed for ${appKey}.${stateKey}`,
                {
                  error: parsed.error,
                  value: revisedState.value,
                  globalRevisionId,
                },
              );

              throw new Error(`Checkout validation failed for ${appKey}.${stateKey}`);
            }

            return [
              stateKey,
              {
                value: parsed.data,
                revision: revisedState.revision,
              },
            ];
          }),
        ) as RevisedStatesSnapshotMap;

        storeApi.getState().setStateSnapshots(validatedSnapshots);

        return validatedSnapshots;
      } catch (error) {
        const normalizedError = normalizeError(
          error,
          `${appKey}@${String(globalRevisionId)}`,
        );

        stateKeys.forEach((key) => {
          storeApi.getState().setError(key, normalizedError);
        });

        throw normalizedError;
      } finally {
        stateKeys.forEach((key) => {
          storeApi.getState().setLoading(key, false);
        });
      }
    },
    [definitions, globalStateStoreRegistry, transport],
  );

  const value = useMemo<StateContextValue>(
    () => ({
      definitions,
      ensureState,
      refetchState,
      checkout,
      goLive,
      stopLive,
    }),
    [checkout, definitions, ensureState, goLive, refetchState, stopLive],
  );

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      subscriptions.clear();
    };
  }, []);

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}
