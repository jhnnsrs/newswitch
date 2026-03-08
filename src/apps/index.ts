import { appDefinition as DefaultAppDefinition } from './default/app';
import { appDefinition as MikrosckopeAppDefinition } from './mikrosckope/app';

export const appsDefinition = {
  default: DefaultAppDefinition,
  mikrosckope: MikrosckopeAppDefinition,
} as const;

export type AppsDefinition = typeof appsDefinition;
export type AppKey = keyof AppsDefinition;
export type AppDefinition = AppsDefinition[AppKey];
export const defaultAppKey = 'default' satisfies AppKey;
export const appDefinition = appsDefinition[defaultAppKey];
