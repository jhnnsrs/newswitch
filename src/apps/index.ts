import type { AppsDefinition as RekuestAppsDefinition } from '@/lib/rekuest';
import { appDefinition as DefaultAppDefinition } from './default/app';

export const appsDefinition = {
  default: DefaultAppDefinition,
} as const satisfies RekuestAppsDefinition<'default'>;

export type AppsDefinition = typeof appsDefinition;
export type AppKey = keyof AppsDefinition;
export type AppDefinition = AppsDefinition[AppKey];
