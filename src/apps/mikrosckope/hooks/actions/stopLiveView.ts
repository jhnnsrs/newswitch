import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeStopLiveViewArgsSchema = z.object({});
export const MikrosckopeStopLiveViewReturnSchema = z.object({
  return0: z.string(),
});

// --- Types ---
export type MikrosckopeStopLiveViewArgs = z.infer<
  typeof MikrosckopeStopLiveViewArgsSchema
>;
export type MikrosckopeStopLiveViewReturn = z.infer<
  typeof MikrosckopeStopLiveViewReturnSchema
>;

export const StopLiveViewArgsSchema = MikrosckopeStopLiveViewArgsSchema;
export const StopLiveViewReturnSchema = MikrosckopeStopLiveViewReturnSchema;
export type StopLiveViewArgs = MikrosckopeStopLiveViewArgs;
export type StopLiveViewReturn = MikrosckopeStopLiveViewReturn;

// --- Definition ---
export const MikrosckopeStopLiveViewDefinition: ActionDefinition<
  MikrosckopeStopLiveViewArgs,
  MikrosckopeStopLiveViewReturn
> = {
  name: 'stop_live_view',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeStopLiveViewArgsSchema,
  returnSchema: MikrosckopeStopLiveViewReturnSchema,
  lockKeys: ['camera_parameters'],
};

export const StopLiveViewDefinition = MikrosckopeStopLiveViewDefinition;

/**
 * undefined
 */
export const useMikrosckopeStopLiveView = () => {
  return useTransportAction(MikrosckopeStopLiveViewDefinition);
};

export const useStopLiveView = useMikrosckopeStopLiveView;
