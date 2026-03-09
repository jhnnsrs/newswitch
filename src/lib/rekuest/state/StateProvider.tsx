import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  getScopedStateKey,
  getStateDefinitionsRecord,
  resolveStateDefinition,
  type StateDefinition,
} from '@/lib/rekuest/state';
import {
  buildLocalMaterializationPlan,
  DEFAULT_FORWARD_EVENT_WINDOW,
  DEFAULT_MAX_LOCAL_MATERIALIZATION_EVENTS,
  materializeSnapshotMap,
  toNumericGlobalRevision,
  toSnapshotMap,
  type CheckoutConfig,
} from '@/lib/rekuest/state/materialization';
import type {
  Envelope as StateStoreEnvelope,
  PatchSegment,
} from '@/lib/rekuest/state/store';
import { useGlobalStateStoreRegistry } from '@/lib/rekuest/state/store';
import { useTransport } from '@/lib/rekuest/transport/transport-context';
import {
  StateEventType,
  type RevisedStatesSnapshotMap,
  type StateCollectionResponse,
  type StateTransportMessage,
  type TransportMessageSubscription,
} from '@/lib/rekuest/transport/types';
import { StateContext, type StateContextValue } from '@/lib/rekuest/state/state-context';

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

/**
 * Validates a reconstructed snapshot map against the generated state schemas so
 * checkout can safely switch between live and replayed history.
 */
function validateSnapshots(
  appKey: string,
  globalRevisionId: string | number,
  snapshotMap: RevisedStatesSnapshotMap,
  definitions: StateContextValue['definitions'],
): RevisedStatesSnapshotMap {
  return Object.fromEntries(
    Object.entries(snapshotMap).map(([stateKey, revisedState]) => {
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
}

function toSnapshotMapFromCollection(
  response: StateCollectionResponse,
  stateKeys?: string[],
): RevisedStatesSnapshotMap {
  const requestedStateKeys = stateKeys ?? Object.keys(response.states);
  const snapshotMap: RevisedStatesSnapshotMap = {};

  for (const stateKey of requestedStateKeys) {
    const stateView = response.states[stateKey];

    if (!stateView || !stateView.initialized || stateView.value == null) {
      continue;
    }

    snapshotMap[stateKey] = {
      value: stateView.value,
      revision: stateView.local_revision,
    };
  }

  return snapshotMap;
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

  const resolveCheckoutConfig = useCallback(
    (options?: StateContextValue['checkout'] extends (...args: infer TArgs) => unknown ? TArgs[2] : never): CheckoutConfig => ({
      maxLocalMaterializationEvents:
        options?.maxLocalMaterializationEvents ?? DEFAULT_MAX_LOCAL_MATERIALIZATION_EVENTS,
      forwardEventWindow:
        options?.forwardEventWindow ?? DEFAULT_FORWARD_EVENT_WINDOW,
    }),
    [],
  );

  const fetchValidatedCheckoutSnapshot = useCallback(
    async (
      appKey: string,
      globalRevisionId: string | number,
      stateKeys: string[],
    ): Promise<RevisedStatesSnapshotMap> => {
      const snapshot = await transport.fetchStateCheckout(appKey, globalRevisionId, stateKeys);
      return validateSnapshots(appKey, globalRevisionId, snapshot, definitions);
    },
    [definitions, transport],
  );

  const fetchValidatedStateCollection = useCallback(
    async (
      appKey: string,
      stateKeys: string[],
    ): Promise<{
      snapshotMap: RevisedStatesSnapshotMap;
      globalRevision: number | null;
    }> => {
      const response = await transport.fetchAll(appKey, stateKeys);
      const snapshotMap = validateSnapshots(
        appKey,
        response.current_global_revision ?? 'current',
        toSnapshotMapFromCollection(response, stateKeys),
        definitions,
      );

      return {
        snapshotMap,
        globalRevision: response.current_global_revision,
      };
    },
    [definitions, transport],
  );

  /**
   * Fetches a nearer snapshot and replays a bounded forward window. This keeps
   * replay deterministic while avoiding very large local patch replays.
   */
  const fetchSnapshotWithForwardWindow = useCallback(
    async (
      appKey: string,
      globalRevisionId: string | number,
      stateKeys: string[],
      config: CheckoutConfig,
    ): Promise<{
      baseRevision: string | number;
      baseSnapshot: RevisedStatesSnapshotMap;
      materializedSnapshot: RevisedStatesSnapshotMap;
      segments: PatchSegment[];
    }> => {
      const numericTargetRevision = toNumericGlobalRevision(globalRevisionId);

      if (numericTargetRevision === null) {
        const directSnapshot = await fetchValidatedCheckoutSnapshot(
          appKey,
          globalRevisionId,
          stateKeys,
        );

        return {
          baseRevision: globalRevisionId,
          baseSnapshot: directSnapshot,
          materializedSnapshot: directSnapshot,
          segments: [],
        };
      }

      const forwardEventWindow = Math.max(0, config.forwardEventWindow);
      const baseRevision = Math.max(0, numericTargetRevision - forwardEventWindow);
      const baseSnapshot = await fetchValidatedCheckoutSnapshot(appKey, baseRevision, stateKeys);

      if (baseRevision === numericTargetRevision) {
        return {
          baseRevision,
          baseSnapshot,
          materializedSnapshot: baseSnapshot,
          segments: [],
        };
      }

      const segments = await transport.fetchStateSegments(
        appKey,
        baseRevision,
        numericTargetRevision,
        stateKeys,
      );

      const materializedSnapshot = validateSnapshots(
        appKey,
        globalRevisionId,
        materializeSnapshotMap(baseSnapshot, segments),
        definitions,
      );

      return {
        baseRevision,
        baseSnapshot,
        materializedSnapshot,
        segments,
      };
    },
    [definitions, fetchValidatedCheckoutSnapshot, transport],
  );

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
        .fetchState<T>(
          definition.appKey as TransportAppKey,
          definition.key,
        )
        .then((response) => {
          const parsed = definition.schema.safeParse(response.value);

          if (!parsed.success) {
            console.error(`[StateProvider] Validation failed for ${definition.appKey}.${definition.key}`, {
              error: parsed.error,
              value: response.value,
            });

            throw new Error(`Validation failed for ${definition.appKey}.${definition.key}`);
          }

          storeApi.getState().setStateSnapshot(
            definition.key,
            parsed.data as T,
            response.local_revision ?? 0,
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

  const refetchAll = useCallback<StateContextValue['refetchAll']>(
    async (appKey, options) => {
      const availableDefinitions = Object.values(definitions).filter(
        (definition) => definition.appKey === appKey,
      );
      const stateKeys = options?.stateKeys ?? availableDefinitions.map((definition) => definition.key);

      if (stateKeys.length === 0) {
        return {};
      }

      const storeApi = globalStateStoreRegistry.getStoreApi(appKey);
      stateKeys.forEach((key) => {
        const stateStore = storeApi.getState();
        stateStore.setLoading(key, true);
        stateStore.setError(key, null);
      });

      try {
        const { snapshotMap, globalRevision } = await fetchValidatedStateCollection(
          appKey,
          stateKeys,
        );

        const stateStore = storeApi.getState();
        stateStore.setStateSnapshots(snapshotMap);
        if (globalRevision != null) {
          stateStore.setGlobalRevision(globalRevision);
          stateStore.cacheSnapshot(globalRevision, snapshotMap);
        }

        return snapshotMap;
      } catch (error) {
        const normalizedError = normalizeError(error, `${appKey}@current`);
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
    [definitions, fetchValidatedStateCollection, globalStateStoreRegistry],
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
        listener: (message) => handleMessage(typedAppKey, message as StateTransportMessage),
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
      const checkoutConfig = resolveCheckoutConfig(options);

      await stopLive(appKey);

      storeApi.getState().setGlobalRevision(globalRevisionId);

      stateKeys.forEach((key) => {
        const stateStore = storeApi.getState();
        stateStore.setLoading(key, true);
        stateStore.setError(key, null);
      });

      try {
        const currentStore = storeApi.getState();
        const numericTargetRevision = toNumericGlobalRevision(globalRevisionId);
        const localPlan =
          numericTargetRevision === null
            ? null
            : buildLocalMaterializationPlan(
                currentStore.snapshots,
                currentStore.segments,
                stateKeys,
                numericTargetRevision,
                checkoutConfig.maxLocalMaterializationEvents,
              );

        const checkoutResult = localPlan
          ? {
              baseRevision: localPlan.baseSnapshot.revision,
              baseSnapshot: toSnapshotMap(localPlan.baseSnapshot),
              materializedSnapshot: validateSnapshots(
                appKey,
                globalRevisionId,
                materializeSnapshotMap(
                  toSnapshotMap(localPlan.baseSnapshot),
                  localPlan.segments,
                ),
                definitions,
              ),
              segments: localPlan.segments,
            }
          : await fetchSnapshotWithForwardWindow(
              appKey,
              globalRevisionId,
              stateKeys,
              checkoutConfig,
            );

        const stateStore = storeApi.getState();
        stateStore.setStateSnapshots(checkoutResult.materializedSnapshot);
        stateStore.cacheSnapshot(checkoutResult.baseRevision, checkoutResult.baseSnapshot);
        stateStore.cacheSnapshot(globalRevisionId, checkoutResult.materializedSnapshot);
        if (checkoutResult.segments.length > 0) {
          stateStore.upsertSegments(checkoutResult.segments);
        }

        return checkoutResult.materializedSnapshot;
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
    [
      definitions,
      fetchSnapshotWithForwardWindow,
      globalStateStoreRegistry,
      resolveCheckoutConfig,
      stopLive,
    ],
  );

  const value = useMemo<StateContextValue>(
    () => ({
      definitions,
      ensureState,
      refetchState,
      refetchAll,
      checkout,
      goLive,
      stopLive,
    }),
    [checkout, definitions, ensureState, goLive, refetchAll, refetchState, stopLive],
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
