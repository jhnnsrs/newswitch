export { appDefinition, appsDefinition, defaultAppKey } from './apps';
export type { AppDefinition, AppKey, AppsDefinition } from './apps';

import { appDefinition } from "@/apps";
import { createScopedProvider } from '@/lib/rekuest';


export const transportConfigs = {
    default: {
         kind: "fastapi",
         url: import.meta.env.VITE_TRANSPORT_URL || "ws://localhost:4000/transport",
    },
    microscope: {
        kind: "fastapi",
        url: import.meta.env.VITE_TRANSPORT_URL || "ws://localhost:8000/transport",
    },
};


export const LiveAppsProvider = createScopedProvider({
    definition: appDefinition,
    config: transportConfigs,
    defaultScope: 'live',
});

export const ReplayAppsProvider = createScopedProvider({
    definition: appDefinition,
    config: transportConfigs,
    defaultScope: 'replay',
});

