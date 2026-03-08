import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeSetIlluminationIntensityArgsSchema = z.object({
  /** Light intensity value */
  intensity: z.number().describe('Light intensity value'),
  /** Illumination channel number (default 1) */
  channel: z
    .number()
    .describe('Illumination channel number (default 1)')
    .optional(),
});
export const MikrosckopeSetIlluminationIntensityReturnSchema = z.object({
  /** The actual clamped intensity value. */
  return0: z.number().describe('The actual clamped intensity value.'),
});

// --- Types ---
export type MikrosckopeSetIlluminationIntensityArgs = z.infer<
  typeof MikrosckopeSetIlluminationIntensityArgsSchema
>;
export type MikrosckopeSetIlluminationIntensityReturn = z.infer<
  typeof MikrosckopeSetIlluminationIntensityReturnSchema
>;

export const SetIlluminationIntensityArgsSchema =
  MikrosckopeSetIlluminationIntensityArgsSchema;
export const SetIlluminationIntensityReturnSchema =
  MikrosckopeSetIlluminationIntensityReturnSchema;
export type SetIlluminationIntensityArgs =
  MikrosckopeSetIlluminationIntensityArgs;
export type SetIlluminationIntensityReturn =
  MikrosckopeSetIlluminationIntensityReturn;

// --- Definition ---
export const MikrosckopeSetIlluminationIntensityDefinition: ActionDefinition<
  MikrosckopeSetIlluminationIntensityArgs,
  MikrosckopeSetIlluminationIntensityReturn
> = {
  name: 'set_illumination_intensity',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeSetIlluminationIntensityArgsSchema,
  returnSchema: MikrosckopeSetIlluminationIntensityReturnSchema,
  lockKeys: ['illumination'],
};

export const SetIlluminationIntensityDefinition =
  MikrosckopeSetIlluminationIntensityDefinition;

/**
 * undefined
 */
export const useMikrosckopeSetIlluminationIntensity = () => {
  return useTransportAction(MikrosckopeSetIlluminationIntensityDefinition);
};

export const useSetIlluminationIntensity =
  useMikrosckopeSetIlluminationIntensity;
