import type { ReactNode } from 'react';
import type { AppDefinition, AppKey, AppsDefinition } from '@/apps';
import { LocalStoreProvider } from '@/store';
import { TransportProvider } from '@/transport';
import type { TransportConfig } from '@/transport';
import { ActionProvider } from './ActionProvider';
import { RekuestStoreProvider } from './RekuestStoreProvider';
import { StateProvider } from './StateProvider';

type ScopedProviderDefinition = AppsDefinition | AppDefinition;

type TransportEndpointConfig = {
  kind?: string;
  url?: string;
  apiEndpoint?: string;
  wsEndpoint?: string;
};

type TransportEndpointMap<TKey extends string> = Partial<
  Record<TKey, TransportEndpointConfig>
>;

type ScopedProviderTransportConfig<TKey extends string> =
  | TransportConfig
  | TransportEndpointMap<TKey>;

interface NormalizedDefinition<TKey extends string = string> {
  apps: Record<TKey, AppDefinition>;
  defaultAppKey: TKey;
}

export interface CreateScopedProviderOptions<TKey extends string = string> {
  definition: ScopedProviderDefinition;
  config: ScopedProviderTransportConfig<TKey>;
  instanceId?: string;
  defaultScope?: string;
  reconnect?: TransportConfig['reconnect'];
  pingInterval?: number;
}

export interface ScopedProviderProps {
  children: ReactNode;
  scope?: string;
  revision?: string | number;
  instanceId?: string;
  transportConfig?: Partial<TransportConfig>;
}

const DEFAULT_SCOPE = 'default';
const DEFAULT_INSTANCE_ID = 'rekuest-scoped-provider';

const isSingleAppDefinition = (
  definition: ScopedProviderDefinition,
): definition is AppDefinition => {
  return (
    'key' in definition &&
    'actions' in definition &&
    'locks' in definition &&
    'states' in definition
  );
};

const isTransportConfig = <TKey extends string>(
  config: ScopedProviderTransportConfig<TKey>,
): config is TransportConfig => {
  return 'apiEndpoint' in config && 'instanceId' in config;
};

const normalizeDefinition = (
  definition: ScopedProviderDefinition,
): NormalizedDefinition => {
  if (isSingleAppDefinition(definition)) {
    const singleDefinition = definition;
    return {
      apps: {
        [singleDefinition.key]: singleDefinition,
      },
      defaultAppKey: singleDefinition.key,
    } as NormalizedDefinition;
  }

  const appKeys = Object.keys(definition) as AppKey[];
  const defaultAppKey = (appKeys[0] ?? 'default') as AppKey;

  return {
    apps: definition as Record<AppKey, AppDefinition>,
    defaultAppKey,
  };
};

const toApiEndpointFromUrl = (url: string) => {
  const resolved = new URL(url);

  if (resolved.protocol === 'ws:' || resolved.protocol === 'wss:') {
    resolved.protocol = resolved.protocol === 'wss:' ? 'https:' : 'http:';
  }

  return resolved.toString();
};

const toWsEndpointFromUrl = (url: string) => {
  const resolved = new URL(url);

  if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
    resolved.protocol = resolved.protocol === 'https:' ? 'wss:' : 'ws:';
  }

  return resolved.toString();
};

const normalizeEndpoint = (endpoint: TransportEndpointConfig) => {
  const apiEndpoint = endpoint.apiEndpoint ?? (endpoint.url ? toApiEndpointFromUrl(endpoint.url) : undefined);
  const wsEndpoint = endpoint.wsEndpoint ?? (endpoint.url ? toWsEndpointFromUrl(endpoint.url) : undefined);

  if (!apiEndpoint) {
    throw new Error('Scoped provider transport config requires an apiEndpoint or url.');
  }

  return {
    apiEndpoint,
    wsEndpoint,
  };
};

const buildTransportConfig = <TKey extends string>(
  defaultAppKey: TKey,
  config: ScopedProviderTransportConfig<TKey>,
  instanceId: string,
  reconnect?: TransportConfig['reconnect'],
  pingInterval?: number,
  overrides?: Partial<TransportConfig>,
): TransportConfig => {
  if (isTransportConfig(config)) {
    return {
      ...config,
      ...overrides,
      instanceId: overrides?.instanceId ?? instanceId ?? config.instanceId,
      reconnect: overrides?.reconnect ?? reconnect ?? config.reconnect,
      pingInterval: overrides?.pingInterval ?? pingInterval ?? config.pingInterval,
    };
  }

  const selected = config[defaultAppKey];

  if (!selected) {
    throw new Error(`No transport endpoint configured for app key "${defaultAppKey}".`);
  }

  const normalizedSelected = normalizeEndpoint(selected);
  const appEndpoints = Object.fromEntries(
    Object.entries(config)
      .filter((entry): entry is [string, TransportEndpointConfig] => entry[1] !== undefined)
      .map(([key, value]) => [key, normalizeEndpoint(value)]),
  );

  return {
    apiEndpoint: normalizedSelected.apiEndpoint,
    wsEndpoint: normalizedSelected.wsEndpoint,
    instanceId: overrides?.instanceId ?? instanceId,
    reconnect: overrides?.reconnect ?? reconnect,
    pingInterval: overrides?.pingInterval ?? pingInterval,
    appEndpoints,
    ...overrides,
  };
};

const buildScopeKey = (
  scope: string,
  revision?: string | number,
) => {
  return [scope, revision == null ? null : `revision-${revision}`]
    .filter((value): value is string => value !== null)
    .join(':');
};

export function createScopedProvider<TKey extends string = string>({
  definition,
  config,
  instanceId = DEFAULT_INSTANCE_ID,
  defaultScope = DEFAULT_SCOPE,
  reconnect,
  pingInterval,
}: CreateScopedProviderOptions<TKey>) {
  const normalizedDefinition = normalizeDefinition(definition);

  function ScopedProvider({
    children,
    scope = defaultScope,
    revision,
    transportConfig,
    instanceId: instanceIdOverride,
  }: ScopedProviderProps) {
    const scopeKey = buildScopeKey(scope, revision);
    const resolvedConfig = buildTransportConfig(
      normalizedDefinition.defaultAppKey as TKey,
      config,
      instanceIdOverride ?? instanceId,
      reconnect,
      pingInterval,
      transportConfig,
    );

    return (
      <TransportProvider
        key={scopeKey}
        apps={normalizedDefinition.apps as AppsDefinition}
        config={resolvedConfig}
      >
        <RekuestStoreProvider scope={scopeKey}>
          <LocalStoreProvider scope={scopeKey}>
            <StateProvider>
              <ActionProvider>{children}</ActionProvider>
            </StateProvider>
          </LocalStoreProvider>
        </RekuestStoreProvider>
      </TransportProvider>
    );
  }

  ScopedProvider.displayName = 'ScopedRekuestProvider';

  return ScopedProvider;
}