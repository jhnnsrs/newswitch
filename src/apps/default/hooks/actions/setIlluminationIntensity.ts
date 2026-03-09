import { z } from 'zod';
import { useAction, type ActionDefinition } from '@/lib/rekuest/task';

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
export const SetIlluminationIntensityReturnSchema = z.object({
  /** The actual clamped intensity value. */
  return0: z.number().describe('The actual clamped intensity value.'),
});

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
  appKey: 'default',
  description: '',
  argsSchema: SetIlluminationIntensityArgsSchema,
  returnSchema: SetIlluminationIntensityReturnSchema,
  lockKeys: ['illumination'],
};

/**
 * undefined
 */
export const useSetIlluminationIntensity = () => {
  return useAction(SetIlluminationIntensityDefinition);
};
