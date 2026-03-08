import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeStartLiveViewArgsSchema = z.object({});
export const MikrosckopeStartLiveViewReturnSchema = z.object({
  return0: z.string(),
});

// --- Types ---
export type MikrosckopeStartLiveViewArgs = z.infer<
  typeof MikrosckopeStartLiveViewArgsSchema
>;
export type MikrosckopeStartLiveViewReturn = z.infer<
  typeof MikrosckopeStartLiveViewReturnSchema
>;

export const StartLiveViewArgsSchema = MikrosckopeStartLiveViewArgsSchema;
export const StartLiveViewReturnSchema = MikrosckopeStartLiveViewReturnSchema;
export type StartLiveViewArgs = MikrosckopeStartLiveViewArgs;
export type StartLiveViewReturn = MikrosckopeStartLiveViewReturn;

// --- Definition ---
export const MikrosckopeStartLiveViewDefinition: ActionDefinition<
  MikrosckopeStartLiveViewArgs,
  MikrosckopeStartLiveViewReturn
> = {
  name: 'start_live_view',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeStartLiveViewArgsSchema,
  returnSchema: MikrosckopeStartLiveViewReturnSchema,
  lockKeys: ['camera_parameters'],
};

export const StartLiveViewDefinition = MikrosckopeStartLiveViewDefinition;

/**
 * undefined
 */
export const useMikrosckopeStartLiveView = () => {
  return useTransportAction(MikrosckopeStartLiveViewDefinition);
};

export const useStartLiveView = useMikrosckopeStartLiveView;
