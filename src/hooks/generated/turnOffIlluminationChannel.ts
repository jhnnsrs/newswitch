import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const TurnOffIlluminationChannelArgsSchema = z.object({
  /** Illumination channel number to turn off */
  channel: z.number().describe('Illumination channel number to turn off'),
});
export const TurnOffIlluminationChannelReturnSchema = z
  .string()
  .describe('Confirmation message.');

// --- Types ---
export type TurnOffIlluminationChannelArgs = z.infer<
  typeof TurnOffIlluminationChannelArgsSchema
>;
export type TurnOffIlluminationChannelReturn = z.infer<
  typeof TurnOffIlluminationChannelReturnSchema
>;

// --- Definition ---
export const TurnOffIlluminationChannelDefinition: ActionDefinition<
  TurnOffIlluminationChannelArgs,
  TurnOffIlluminationChannelReturn
> = {
  name: 'turn_off_illumination_channel',
  description: '',
  argsSchema: TurnOffIlluminationChannelArgsSchema,
  returnSchema: TurnOffIlluminationChannelReturnSchema,
  lockKeys: ['illumination'],
};

/**
 * undefined
 */
export const useTurnOffIlluminationChannel = () => {
  return useTransportAction(TurnOffIlluminationChannelDefinition);
};
