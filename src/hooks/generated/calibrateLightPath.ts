import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

/** Shared state for affine transformation parameters. */
export const CalibratedLightPathSchema = z
  .object({
    /** 4x4 affine transformation matrix for mapping between coordinate systems */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe(
        '4x4 affine transformation matrix for mapping between coordinate systems',
      ),
    /** Field of view width in micrometers */
    fov_width: z
      .number()
      .describe('Field of view width in micrometers')
      .optional(),
    /** Field of view height in micrometers */
    fov_height: z
      .number()
      .describe('Field of view height in micrometers')
      .optional(),
    /** Hash of the light path configuration this affine matrix corresponds to */
    light_path_state_hash: z
      .string()
      .describe(
        'Hash of the light path configuration this affine matrix corresponds to',
      )
      .optional(),
  })
  .brand('calibrated_light_path');
/** Shared state for affine transformation parameters. */
export type CalibratedLightPath = z.infer<typeof CalibratedLightPathSchema>;

// --- Schemas ---
export const CalibrateLightPathArgsSchema = z.object({});
export const CalibrateLightPathReturnSchema = z.object({
  /** List of acquired images with metadata. */
  return0: z
    .array(
      CalibratedLightPathSchema.describe(
        'Shared state for affine transformation parameters.',
      ),
    )
    .describe('List of acquired images with metadata.'),
});

// --- Types ---
export type CalibrateLightPathArgs = z.infer<
  typeof CalibrateLightPathArgsSchema
>;
export type CalibrateLightPathReturn = z.infer<
  typeof CalibrateLightPathReturnSchema
>;

// --- Definition ---
export const CalibrateLightPathDefinition: ActionDefinition<
  CalibrateLightPathArgs,
  CalibrateLightPathReturn
> = {
  name: 'calibrate_light_path',
  description: '',
  argsSchema: CalibrateLightPathArgsSchema,
  returnSchema: CalibrateLightPathReturnSchema,
  lockKeys: ['camera_parameters', 'stage_position'],
};

/**
 * undefined
 */
export const useCalibrateLightPath = () => {
  return useTransportAction(CalibrateLightPathDefinition);
};
