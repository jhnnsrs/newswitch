import type { RekuestAppDefinition, RekuestAppsDefinition } from '@/lib/rekuest/types';
import type { ResolvedStateDefinition, StateDefinition } from './types';

export const getScopedStateKey = (appKey: string, stateKey: string) =>
  `${appKey}::state::${stateKey}`;

export const resolveStateAppKey = <TAppKey extends string>(
  definition: Pick<StateDefinition<unknown>, 'appKey'>,
  defaultAppKey: TAppKey,
): TAppKey => (definition.appKey as TAppKey | undefined) ?? defaultAppKey;

export const resolveStateDefinition = <
  TAppKey extends string,
  TState extends Record<string, unknown>,
  TKey extends string,
>(
  definition: StateDefinition<TState, TKey>,
  defaultAppKey: TAppKey,
): ResolvedStateDefinition<TState, TKey> => ({
  ...definition,
  appKey: resolveStateAppKey(definition, defaultAppKey),
});

export const getAppStateDefinitions = <TAppKey extends string>(
  app: RekuestAppDefinition<
    TAppKey,
    Record<string, unknown>,
    Record<string, unknown>,
    Record<string, StateDefinition<Record<string, unknown>, string>>
  >,
  fallbackAppKey: TAppKey,
) => {
  return Object.values(app.states).map((definition) =>
    resolveStateDefinition(
      definition as StateDefinition<Record<string, unknown>, string>,
      (definition.appKey as TAppKey | undefined) ?? app.key ?? fallbackAppKey,
    ),
  );
};

export const getAllStateDefinitions = <TAppKey extends string>(
  apps: RekuestAppsDefinition<
    TAppKey,
    Record<string, unknown>,
    Record<string, unknown>,
    Record<string, StateDefinition<Record<string, unknown>, string>>
  >,
  defaultAppKey: TAppKey,
) => {
  return (
    Object.values(apps) as Array<
      RekuestAppDefinition<
        TAppKey,
        Record<string, unknown>,
        Record<string, unknown>,
        Record<string, StateDefinition<Record<string, unknown>, string>>
      >
    >
  ).flatMap((app) =>
    getAppStateDefinitions(app, app.key ?? defaultAppKey),
  );
};

export const getStateDefinitionsRecord = <TAppKey extends string>(
  apps: RekuestAppsDefinition<
    TAppKey,
    Record<string, unknown>,
    Record<string, unknown>,
    Record<string, StateDefinition<Record<string, unknown>, string>>
  >,
  defaultAppKey: TAppKey,
) => {
  return Object.fromEntries(
    getAllStateDefinitions(apps, defaultAppKey).map((definition) => [
      getScopedStateKey(definition.appKey, definition.key),
      definition,
    ]),
  ) as Record<string, ResolvedStateDefinition>;
};
