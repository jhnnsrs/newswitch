import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

/** Shared state for detector parameters. */
export const DetectorStateSchema = z.object({
  slot: z.number().optional(),
  name: z.string().optional(),
  exposure_time: z.number().optional(),
  gain: z.number().optional(),
  colormap: z.string().optional(),
});
/** Shared state for detector parameters. */
export type DetectorState = z.infer<typeof DetectorStateSchema>;

// --- Schemas ---
export const UpdateDetectorArgsSchema = z.object({
  /** Detector slot number */
  slot: z.number().describe('Detector slot number'),
  /** Exposure time in seconds (optional) */
  exposure_time: z
    .number()
    .describe('Exposure time in seconds (optional)')
    .optional(),
  /** Gain value (optional) */
  gain: z.number().describe('Gain value (optional)').optional(),
});
export const UpdateDetectorReturnSchema = DetectorStateSchema.describe(
  'Shared state for detector parameters.',
);

// --- Types ---
export type UpdateDetectorArgs = z.infer<typeof UpdateDetectorArgsSchema>;
export type UpdateDetectorReturn = z.infer<typeof UpdateDetectorReturnSchema>;

// --- Definition ---
export const UpdateDetectorDefinition: ActionDefinition<
  UpdateDetectorArgs,
  UpdateDetectorReturn
> = {
  name: 'update_detector',
  description: '',
  argsSchema: UpdateDetectorArgsSchema,
  returnSchema: UpdateDetectorReturnSchema,
  lockKeys: ['camera_parameters'],
};

/**
 * undefined
 */
export const useUpdateDetector = () => {
  return useTransportAction(UpdateDetectorDefinition);
};
