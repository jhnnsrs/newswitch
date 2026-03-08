import type { AppDefinition, AppKey, AppsDefinition } from '@/apps';
import type { ResolvedStateDefinition, StateDefinition } from './types';

export const getScopedStateKey = (appKey: string, stateKey: string) =>
  `${appKey}::state::${stateKey}`;

export const resolveStateAppKey = (
  definition: Pick<StateDefinition<unknown>, 'appKey'>,
  defaultAppKey: AppKey,
): AppKey => (definition.appKey as AppKey | undefined) ?? defaultAppKey;

export const resolveStateDefinition = <
  TState extends Record<string, unknown>,
  TKey extends string,
>(
  definition: StateDefinition<TState, TKey>,
  defaultAppKey: AppKey,
): ResolvedStateDefinition<TState, TKey> => ({
  ...definition,
  appKey: resolveStateAppKey(definition, defaultAppKey),
});

export const getAppStateDefinitions = (
  app: AppDefinition,
  fallbackAppKey: AppKey,
) => {
  return Object.values(app.states).map((definition) =>
    resolveStateDefinition(
      definition as StateDefinition<Record<string, unknown>, string>,
      (definition.appKey as AppKey | undefined) ?? app.key ?? fallbackAppKey,
    ),
  );
};

export const getAllStateDefinitions = (
  apps: AppsDefinition,
  defaultAppKey: AppKey,
) => {
  return Object.values(apps).flatMap((app) =>
    getAppStateDefinitions(app, app.key ?? defaultAppKey),
  );
};

export const getStateDefinitionsRecord = (
  apps: AppsDefinition,
  defaultAppKey: AppKey,
) => {
  return Object.fromEntries(
    getAllStateDefinitions(apps, defaultAppKey).map((definition) => [
      getScopedStateKey(definition.appKey, definition.key),
      definition,
    ]),
  ) as Record<string, ResolvedStateDefinition>;
};
