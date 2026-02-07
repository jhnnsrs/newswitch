import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const TimelapseAcquisitionArgsSchema = z.object({
  /** Number of time points to capture */
  num_timepoints: z.number().describe('Number of time points to capture'),
  /** Interval between time points in seconds */
  interval_seconds: z
    .number()
    .describe('Interval between time points in seconds'),
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
export const TimelapseAcquisitionReturnSchema = z.array(
  z.record(z.string(), z.any()),
);

// --- Types ---
export type TimelapseAcquisitionArgs = z.infer<
  typeof TimelapseAcquisitionArgsSchema
>;
export type TimelapseAcquisitionReturn = z.infer<
  typeof TimelapseAcquisitionReturnSchema
>;

// --- Definition ---
export const TimelapseAcquisitionDefinition: ActionDefinition<
  TimelapseAcquisitionArgs,
  TimelapseAcquisitionReturn
> = {
  name: 'timelapse_acquisition',
  description: '',
  argsSchema: TimelapseAcquisitionArgsSchema,
  returnSchema: TimelapseAcquisitionReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useTimelapseAcquisition = () => {
  return useTransportAction(TimelapseAcquisitionDefinition);
};
