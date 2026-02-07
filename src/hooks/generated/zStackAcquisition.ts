import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const ZStackAcquisitionArgsSchema = z.object({
  /** Starting Z position in micrometers */
  z_start: z.number().describe('Starting Z position in micrometers'),
  /** Ending Z position in micrometers */
  z_end: z.number().describe('Ending Z position in micrometers'),
  /** Z step size in micrometers */
  z_step: z.number().describe('Z step size in micrometers'),
  /** Detector slot number */
  slot: z.number().describe('Detector slot number').optional(),
  /** Exposure time per frame in seconds */
  exposure_time: z
    .number()
    .describe('Exposure time per frame in seconds')
    .optional(),
  /** Illumination intensity (0-100) */
  intensity: z.number().describe('Illumination intensity (0-100)').optional(),
});
export const ZStackAcquisitionReturnSchema = z.array(
  z.record(z.string(), z.any()),
);

// --- Types ---
export type ZStackAcquisitionArgs = z.infer<typeof ZStackAcquisitionArgsSchema>;
export type ZStackAcquisitionReturn = z.infer<
  typeof ZStackAcquisitionReturnSchema
>;

// --- Definition ---
export const ZStackAcquisitionDefinition: ActionDefinition<
  ZStackAcquisitionArgs,
  ZStackAcquisitionReturn
> = {
  name: 'z_stack_acquisition',
  description: '',
  argsSchema: ZStackAcquisitionArgsSchema,
  returnSchema: ZStackAcquisitionReturnSchema,
  lockKeys: ['stage_position'],
};

/**
 * undefined
 */
export const useZStackAcquisition = () => {
  return useTransportAction(ZStackAcquisitionDefinition);
};
