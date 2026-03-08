import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

/** Shared state for affine transformation parameters. */
export const MikrosckopeCalibratedLightPathSchema = z
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
export type MikrosckopeCalibratedLightPath = z.infer<
  typeof MikrosckopeCalibratedLightPathSchema
>;
export const CalibratedLightPathSchema = MikrosckopeCalibratedLightPathSchema;
export type CalibratedLightPath = MikrosckopeCalibratedLightPath;

// --- Schemas ---
export const MikrosckopeCalibrateLightPathArgsSchema = z.object({});
export const MikrosckopeCalibrateLightPathReturnSchema = z.object({
  /** List of acquired images with metadata. */
  return0: z
    .array(
      MikrosckopeCalibratedLightPathSchema.describe(
        'Shared state for affine transformation parameters.',
      ),
    )
    .describe('List of acquired images with metadata.'),
});

// --- Types ---
export type MikrosckopeCalibrateLightPathArgs = z.infer<
  typeof MikrosckopeCalibrateLightPathArgsSchema
>;
export type MikrosckopeCalibrateLightPathReturn = z.infer<
  typeof MikrosckopeCalibrateLightPathReturnSchema
>;

export const CalibrateLightPathArgsSchema =
  MikrosckopeCalibrateLightPathArgsSchema;
export const CalibrateLightPathReturnSchema =
  MikrosckopeCalibrateLightPathReturnSchema;
export type CalibrateLightPathArgs = MikrosckopeCalibrateLightPathArgs;
export type CalibrateLightPathReturn = MikrosckopeCalibrateLightPathReturn;

// --- Definition ---
export const MikrosckopeCalibrateLightPathDefinition: ActionDefinition<
  MikrosckopeCalibrateLightPathArgs,
  MikrosckopeCalibrateLightPathReturn
> = {
  name: 'calibrate_light_path',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeCalibrateLightPathArgsSchema,
  returnSchema: MikrosckopeCalibrateLightPathReturnSchema,
  lockKeys: ['camera_parameters', 'stage_position'],
};

export const CalibrateLightPathDefinition =
  MikrosckopeCalibrateLightPathDefinition;

/**
 * undefined
 */
export const useMikrosckopeCalibrateLightPath = () => {
  return useAction(MikrosckopeCalibrateLightPathDefinition);
};

export const useCalibrateLightPath = useMikrosckopeCalibrateLightPath;
