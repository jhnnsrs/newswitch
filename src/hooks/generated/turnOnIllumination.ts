import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const TurnOnIlluminationArgsSchema = z.object({
  /** Illumination channel number (default 1) */
  channel: z
    .number()
    .describe('Illumination channel number (default 1)')
    .optional(),
  /** Optional intensity to set. Uses current/default if not provided. */
  intensity: z
    .number()
    .describe(
      'Optional intensity to set. Uses current/default if not provided.',
    )
    .optional(),
});
export const TurnOnIlluminationReturnSchema = z
  .string()
  .describe('Confirmation message.');

// --- Types ---
export type TurnOnIlluminationArgs = z.infer<
  typeof TurnOnIlluminationArgsSchema
>;
export type TurnOnIlluminationReturn = z.infer<
  typeof TurnOnIlluminationReturnSchema
>;

// --- Definition ---
export const TurnOnIlluminationDefinition: ActionDefinition<
  TurnOnIlluminationArgs,
  TurnOnIlluminationReturn
> = {
  name: 'turn_on_illumination',
  description: '',
  argsSchema: TurnOnIlluminationArgsSchema,
  returnSchema: TurnOnIlluminationReturnSchema,
  lockKeys: ['illumination'],
};

/**
 * undefined
 */
export const useTurnOnIllumination = () => {
  return useTransportAction(TurnOnIlluminationDefinition);
};
