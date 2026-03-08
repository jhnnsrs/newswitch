import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

/** Shared state for detector parameters. */
export const MikrosckopeDetectorSchema = z
  .object({
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
    is_acquiring: z.boolean().optional(),
    data_type: z.string().optional(),
  })
  .brand('detector');
/** Shared state for detector parameters. */
export type MikrosckopeDetector = z.infer<typeof MikrosckopeDetectorSchema>;
export const DetectorSchema = MikrosckopeDetectorSchema;
export type Detector = MikrosckopeDetector;

// --- Schemas ---
export const MikrosckopeUpdateDetectorArgsSchema = z.object({
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
export const MikrosckopeUpdateDetectorReturnSchema = z.object({
  /** Shared state for detector parameters. */
  return0: MikrosckopeDetectorSchema.describe(
    'Shared state for detector parameters.',
  ),
});

// --- Types ---
export type MikrosckopeUpdateDetectorArgs = z.infer<
  typeof MikrosckopeUpdateDetectorArgsSchema
>;
export type MikrosckopeUpdateDetectorReturn = z.infer<
  typeof MikrosckopeUpdateDetectorReturnSchema
>;

export const UpdateDetectorArgsSchema = MikrosckopeUpdateDetectorArgsSchema;
export const UpdateDetectorReturnSchema = MikrosckopeUpdateDetectorReturnSchema;
export type UpdateDetectorArgs = MikrosckopeUpdateDetectorArgs;
export type UpdateDetectorReturn = MikrosckopeUpdateDetectorReturn;

// --- Definition ---
export const MikrosckopeUpdateDetectorDefinition: ActionDefinition<
  MikrosckopeUpdateDetectorArgs,
  MikrosckopeUpdateDetectorReturn
> = {
  name: 'update_detector',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeUpdateDetectorArgsSchema,
  returnSchema: MikrosckopeUpdateDetectorReturnSchema,
  lockKeys: ['camera_parameters'],
};

export const UpdateDetectorDefinition = MikrosckopeUpdateDetectorDefinition;

/**
 * undefined
 */
export const useMikrosckopeUpdateDetector = () => {
  return useAction(MikrosckopeUpdateDetectorDefinition);
};

export const useUpdateDetector = useMikrosckopeUpdateDetector;
