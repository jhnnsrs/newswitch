import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeTurnOnIlluminationArgsSchema = z.object({
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
export const MikrosckopeTurnOnIlluminationReturnSchema = z.object({
  /** Confirmation message. */
  return0: z.string().describe('Confirmation message.'),
});

// --- Types ---
export type MikrosckopeTurnOnIlluminationArgs = z.infer<
  typeof MikrosckopeTurnOnIlluminationArgsSchema
>;
export type MikrosckopeTurnOnIlluminationReturn = z.infer<
  typeof MikrosckopeTurnOnIlluminationReturnSchema
>;

export const TurnOnIlluminationArgsSchema =
  MikrosckopeTurnOnIlluminationArgsSchema;
export const TurnOnIlluminationReturnSchema =
  MikrosckopeTurnOnIlluminationReturnSchema;
export type TurnOnIlluminationArgs = MikrosckopeTurnOnIlluminationArgs;
export type TurnOnIlluminationReturn = MikrosckopeTurnOnIlluminationReturn;

// --- Definition ---
export const MikrosckopeTurnOnIlluminationDefinition: ActionDefinition<
  MikrosckopeTurnOnIlluminationArgs,
  MikrosckopeTurnOnIlluminationReturn
> = {
  name: 'turn_on_illumination',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeTurnOnIlluminationArgsSchema,
  returnSchema: MikrosckopeTurnOnIlluminationReturnSchema,
  lockKeys: ['illumination'],
};

export const TurnOnIlluminationDefinition =
  MikrosckopeTurnOnIlluminationDefinition;

/**
 * undefined
 */
export const useMikrosckopeTurnOnIllumination = () => {
  return useTransportAction(MikrosckopeTurnOnIlluminationDefinition);
};

export const useTurnOnIllumination = useMikrosckopeTurnOnIllumination;
