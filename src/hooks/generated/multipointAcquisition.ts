import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MultipointAcquisitionArgsSchema = z.object({
  /** List of position dicts with 'x', 'y', 'z' keys */
  positions: z
    .array(z.record(z.string(), z.number()))
    .describe("List of position dicts with 'x', 'y', 'z' keys"),
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
export const MultipointAcquisitionReturnSchema = z.array(
  z.record(z.string(), z.any()),
);

// --- Types ---
export type MultipointAcquisitionArgs = z.infer<
  typeof MultipointAcquisitionArgsSchema
>;
export type MultipointAcquisitionReturn = z.infer<
  typeof MultipointAcquisitionReturnSchema
>;

// --- Definition ---
export const MultipointAcquisitionDefinition: ActionDefinition<
  MultipointAcquisitionArgs,
  MultipointAcquisitionReturn
> = {
  name: 'multipoint_acquisition',
  description: '',
  argsSchema: MultipointAcquisitionArgsSchema,
  returnSchema: MultipointAcquisitionReturnSchema,
  lockKeys: ['camera_parameters', 'illumination', 'stage_position'],
};

/**
 * undefined
 */
export const useMultipointAcquisition = () => {
  return useTransportAction(MultipointAcquisitionDefinition);
};
