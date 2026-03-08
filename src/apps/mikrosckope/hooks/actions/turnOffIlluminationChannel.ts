import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeTurnOffIlluminationChannelArgsSchema = z.object({
  /** Illumination channel number to turn off */
  channel: z.number().describe('Illumination channel number to turn off'),
});
export const MikrosckopeTurnOffIlluminationChannelReturnSchema = z.object({
  /** Confirmation message. */
  return0: z.string().describe('Confirmation message.'),
});

// --- Types ---
export type MikrosckopeTurnOffIlluminationChannelArgs = z.infer<
  typeof MikrosckopeTurnOffIlluminationChannelArgsSchema
>;
export type MikrosckopeTurnOffIlluminationChannelReturn = z.infer<
  typeof MikrosckopeTurnOffIlluminationChannelReturnSchema
>;

export const TurnOffIlluminationChannelArgsSchema =
  MikrosckopeTurnOffIlluminationChannelArgsSchema;
export const TurnOffIlluminationChannelReturnSchema =
  MikrosckopeTurnOffIlluminationChannelReturnSchema;
export type TurnOffIlluminationChannelArgs =
  MikrosckopeTurnOffIlluminationChannelArgs;
export type TurnOffIlluminationChannelReturn =
  MikrosckopeTurnOffIlluminationChannelReturn;

// --- Definition ---
export const MikrosckopeTurnOffIlluminationChannelDefinition: ActionDefinition<
  MikrosckopeTurnOffIlluminationChannelArgs,
  MikrosckopeTurnOffIlluminationChannelReturn
> = {
  name: 'turn_off_illumination_channel',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeTurnOffIlluminationChannelArgsSchema,
  returnSchema: MikrosckopeTurnOffIlluminationChannelReturnSchema,
  lockKeys: ['illumination'],
};

export const TurnOffIlluminationChannelDefinition =
  MikrosckopeTurnOffIlluminationChannelDefinition;

/**
 * undefined
 */
export const useMikrosckopeTurnOffIlluminationChannel = () => {
  return useTransportAction(MikrosckopeTurnOffIlluminationChannelDefinition);
};

export const useTurnOffIlluminationChannel =
  useMikrosckopeTurnOffIlluminationChannel;
