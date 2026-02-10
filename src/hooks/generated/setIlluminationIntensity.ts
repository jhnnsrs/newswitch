import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const SetIlluminationIntensityArgsSchema = z.object({
  /** Light intensity value */
  intensity: z.number().describe('Light intensity value'),
  /** Illumination channel number (default 1) */
  channel: z
    .number()
    .describe('Illumination channel number (default 1)')
    .optional(),
});
export const SetIlluminationIntensityReturnSchema = z
  .number()
  .describe('The actual clamped intensity value.');

// --- Types ---
export type SetIlluminationIntensityArgs = z.infer<
  typeof SetIlluminationIntensityArgsSchema
>;
export type SetIlluminationIntensityReturn = z.infer<
  typeof SetIlluminationIntensityReturnSchema
>;

// --- Definition ---
export const SetIlluminationIntensityDefinition: ActionDefinition<
  SetIlluminationIntensityArgs,
  SetIlluminationIntensityReturn
> = {
  name: 'set_illumination_intensity',
  description: '',
  argsSchema: SetIlluminationIntensityArgsSchema,
  returnSchema: SetIlluminationIntensityReturnSchema,
  lockKeys: ['illumination'],
};

/**
 * undefined
 */
export const useSetIlluminationIntensity = () => {
  return useTransportAction(SetIlluminationIntensityDefinition);
};
