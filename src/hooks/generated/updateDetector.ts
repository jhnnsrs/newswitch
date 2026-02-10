import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

/** Shared state for detector parameters. */
export const DetectorSchema = z.object({
  slot: z.number().optional(),
  name: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  is_active: z.boolean().optional(),
  current_exposure_time: z.number().optional(),
  current_gain: z.number().optional(),
  current_colormap: z.string().optional(),
  pixel_size_um: z.number().optional(),
  preset_exposure_times: z.array(z.number()),
  max_exposure_time: z.number().optional(),
  min_exposure_time: z.number().optional(),
  max_gain: z.number().optional(),
  min_gain: z.number().optional(),
});
/** Shared state for detector parameters. */
export type Detector = z.infer<typeof DetectorSchema>;

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
export const UpdateDetectorReturnSchema = DetectorSchema.describe(
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
