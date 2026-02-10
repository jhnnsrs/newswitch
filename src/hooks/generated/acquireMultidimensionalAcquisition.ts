import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

/** Represents an illumination channel to acquire. */
export const IlluminationSchema = z.object({
  source: z.string(),
  wavelength: z.number(),
  intensity: z.number(),
});
/** Represents an illumination channel to acquire. */
export type Illumination = z.infer<typeof IlluminationSchema>;

/** Represents which channels to acquire at each position. */
export const StreamsSchema = z
  .object({
    /** Name or slot of the detector to use for this stream (e.g., 'Camera1' or '1') */
    detector: z
      .string()
      .describe(
        "Name or slot of the detector to use for this stream (e.g., 'Camera1' or '1')",
      ),
    /** Mapping name for this stream (e.g., 'GFP', 'RFP') to be used in file naming and metadata */
    mapping: z
      .string()
      .describe(
        "Mapping name for this stream (e.g., 'GFP', 'RFP') to be used in file naming and metadata",
      ),
    /** List of illuminations to use for this stream (e.g., [{'source': 'LED1', 'wavelength': 488, 'intensity': 0.8}]) */
    illuminations: z
      .array(
        IlluminationSchema.describe(
          'Represents an illumination channel to acquire.',
        ),
      )
      .describe(
        "List of illuminations to use for this stream (e.g., [{'source': 'LED1', 'wavelength': 488, 'intensity': 0.8}])",
      ),
  })
  .superRefine((val, ctx) => {
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type ValidatorFunc = (context: any) => boolean;
      const validatorFn: ValidatorFunc = (context) => context.self.length > 0;
      const context = { self: val['illuminations'] };

      if (!validatorFn(context)) {
        ctx.addIssue({
          code: 'custom',
          message:
            'At least one illumination has an invalid intensity (must be between 0 and 1)',
          path: ['illuminations'],
        });
      }
    }
  });
/** Represents which channels to acquire at each position. */
export type Streams = z.infer<typeof StreamsSchema>;

/** Data class representing a software autofocus hook to be executed during acquisition. */
export const SoftwareAutofocusHookSchema = z.object({
  speed: z.number().optional(),
});
/** Data class representing a software autofocus hook to be executed during acquisition. */
export type SoftwareAutofocusHook = z.infer<typeof SoftwareAutofocusHookSchema>;

/** Data class representing a z-calibration hook to be executed during acquisition. */
export const ZCalibrationHookSchema = z.object({
  calibration_points: z.number().optional(),
});
/** Data class representing a z-calibration hook to be executed during acquisition. */
export type ZCalibrationHook = z.infer<typeof ZCalibrationHookSchema>;

/** Represents a stack of images at different z-slices. */
export const StackSchema = z.object({
  z_offset: z.number(),
  z_slices: z.array(z.number()),
  z_step: z.number(),
  channels: z.array(
    StreamsSchema.describe(
      'Represents which channels to acquire at each position.',
    ),
  ),
  /** List of hooks to execute at each z-slice (e.g., 'autofocus', 'z_calibration') */
  z_hooks: z
    .array(
      z.union([
        SoftwareAutofocusHookSchema.describe(
          'Data class representing a software autofocus hook to be executed during acquisition.',
        ),
        ZCalibrationHookSchema.describe(
          'Data class representing a z-calibration hook to be executed during acquisition.',
        ),
      ]),
    )
    .describe(
      "List of hooks to execute at each z-slice (e.g., 'autofocus', 'z_calibration')",
    ),
});
/** Represents a stack of images at different z-slices. */
export type Stack = z.infer<typeof StackSchema>;

/** Represents a position in 3D space. */
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  stacks: z.array(
    StackSchema.describe('Represents a stack of images at different z-slices.'),
  ),
  /** List of hooks to execute at each position (e.g., 'autofocus', 'z_calibration') */
  p_hooks: z
    .array(
      z.union([
        SoftwareAutofocusHookSchema.describe(
          'Data class representing a software autofocus hook to be executed during acquisition.',
        ),
        ZCalibrationHookSchema.describe(
          'Data class representing a z-calibration hook to be executed during acquisition.',
        ),
      ]),
    )
    .describe(
      "List of hooks to execute at each position (e.g., 'autofocus', 'z_calibration')",
    ),
});
/** Represents a position in 3D space. */
export type Position = z.infer<typeof PositionSchema>;

/** Represents a timepoint in a temporal sequence. */
export const TimepointSchema = z.object({
  /** Absolute time to acquire this timepoint (e.g., '2024-01-01T12:00:00') or None to acquire immediately after the previous timepoint */
  time: z
    .any()
    .describe(
      "Absolute time to acquire this timepoint (e.g., '2024-01-01T12:00:00') or None to acquire immediately after the previous timepoint",
    )
    .optional(),
  /** List of stage positions to acquire at this timepoint */
  positions: z
    .array(PositionSchema.describe('Represents a position in 3D space.'))
    .describe('List of stage positions to acquire at this timepoint'),
  /** Order in which to visit stage positions (e.g., 'sequential', 'random') */
  position_order: z
    .string()
    .describe(
      "Order in which to visit stage positions (e.g., 'sequential', 'random')",
    )
    .optional(),
  /** List of hooks to execute at each timepoint (e.g., 'autofocus', 'z_calibration') */
  t_hooks: z
    .array(
      z.union([
        SoftwareAutofocusHookSchema.describe(
          'Data class representing a software autofocus hook to be executed during acquisition.',
        ),
        ZCalibrationHookSchema.describe(
          'Data class representing a z-calibration hook to be executed during acquisition.',
        ),
      ]),
    )
    .describe(
      "List of hooks to execute at each timepoint (e.g., 'autofocus', 'z_calibration')",
    ),
});
/** Represents a timepoint in a temporal sequence. */
export type Timepoint = z.infer<typeof TimepointSchema>;

/** Configuration for the acquisition. */
export const MultidimensionalAcquisitionSchema = z
  .object({
    /** List of timepoints to acquire, each with its own stage positions and hooks */
    timepoints: z
      .array(
        TimepointSchema.describe(
          'Represents a timepoint in a temporal sequence.',
        ),
      )
      .describe(
        'List of timepoints to acquire, each with its own stage positions and hooks',
      ),
    /** Base file name for acquired images (e.g., 'experiment1') */
    file_name: z
      .string()
      .describe("Base file name for acquired images (e.g., 'experiment1')")
      .optional(),
    /** File format for saving acquired images (e.g., 'TIFF', 'PNG') */
    file_format: z
      .string()
      .describe("File format for saving acquired images (e.g., 'TIFF', 'PNG')")
      .optional(),
    /** List of hooks to execute at the start of the acquisition (e.g., 'autofocus', 'z_calibration') */
    m_hooks: z
      .array(
        z.union([
          SoftwareAutofocusHookSchema.describe(
            'Data class representing a software autofocus hook to be executed during acquisition.',
          ),
          ZCalibrationHookSchema.describe(
            'Data class representing a z-calibration hook to be executed during acquisition.',
          ),
        ]),
      )
      .describe(
        "List of hooks to execute at the start of the acquisition (e.g., 'autofocus', 'z_calibration')",
      ),
  })
  .superRefine((val, ctx) => {
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type ValidatorFunc = (context: any) => boolean;
      const validatorFn: ValidatorFunc = (context) => context.self.length > 0;
      const context = { self: val['timepoints'] };

      if (!validatorFn(context)) {
        ctx.addIssue({
          code: 'custom',
          message: 'You need at least one timepoint to perform an acquisition',
          path: ['timepoints'],
        });
      }
    }
  });
/** Configuration for the acquisition. */
export type MultidimensionalAcquisition = z.infer<
  typeof MultidimensionalAcquisitionSchema
>;

// --- Schemas ---
export const AcquireMultidimensionalAcquisitionArgsSchema = z.object({
  /** Configuration for the acquisition. */
  config: MultidimensionalAcquisitionSchema.describe(
    'Configuration for the acquisition.',
  ),
});
export const AcquireMultidimensionalAcquisitionReturnSchema = z
  .array(z.record(z.string(), z.any()))
  .describe('List of acquired images with metadata.');

// --- Types ---
export type AcquireMultidimensionalAcquisitionArgs = z.infer<
  typeof AcquireMultidimensionalAcquisitionArgsSchema
>;
export type AcquireMultidimensionalAcquisitionReturn = z.infer<
  typeof AcquireMultidimensionalAcquisitionReturnSchema
>;

// --- Definition ---
export const AcquireMultidimensionalAcquisitionDefinition: ActionDefinition<
  AcquireMultidimensionalAcquisitionArgs,
  AcquireMultidimensionalAcquisitionReturn
> = {
  name: 'acquire_multidimensional_acquisition',
  description: '',
  argsSchema: AcquireMultidimensionalAcquisitionArgsSchema,
  returnSchema: AcquireMultidimensionalAcquisitionReturnSchema,
  lockKeys: [
    'hook_registry',
    'illumination',
    'stage_position',
    'io',
    'camera_parameters',
  ],
};

/**
 * undefined
 */
export const useAcquireMultidimensionalAcquisition = () => {
  return useTransportAction(AcquireMultidimensionalAcquisitionDefinition);
};
