import { z } from 'zod';
import { useAction, type ActionDefinition } from '@/lib/rekuest/task';

// --- Shared Models ---

/** Represents an illumination channel to acquire. */
export const IlluminationSchema = z
  .object({
    source: z.string(),
    wavelength: z.number(),
    intensity: z.number(),
  })
  .brand('illumination');
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
  .brand('streams')
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
            'We need at least one illumination channel to acquire this stream',
          path: ['illuminations'],
        });
      }
    }
  });
/** Represents which channels to acquire at each position. */
export type Streams = z.infer<typeof StreamsSchema>;

/** Data class representing a software autofocus hook to be executed during acquisition. */
export const SoftwareAutofocusHookSchema = z
  .object({
    speed: z.number().optional(),
  })
  .brand('software_autofocus_hook');
/** Data class representing a software autofocus hook to be executed during acquisition. */
export type SoftwareAutofocusHook = z.infer<typeof SoftwareAutofocusHookSchema>;

/** Data class representing a z-calibration hook to be executed during acquisition. */
export const ZCalibrationHookSchema = z
  .object({
    calibration_points: z.number().optional(),
  })
  .brand('z_calibration_hook');
/** Data class representing a z-calibration hook to be executed during acquisition. */
export type ZCalibrationHook = z.infer<typeof ZCalibrationHookSchema>;

/** Represents a stack of images at different z-slices. */
export const StackSchema = z
  .object({
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
  })
  .brand('stack');
/** Represents a stack of images at different z-slices. */
export type Stack = z.infer<typeof StackSchema>;

/** Represents a position in 3D space. */
export const PositionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    stacks: z.array(
      StackSchema.describe(
        'Represents a stack of images at different z-slices.',
      ),
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
  })
  .brand('position');
/** Represents a position in 3D space. */
export type Position = z.infer<typeof PositionSchema>;

/** Represents a timepoint in a temporal sequence. */
export const TimepointSchema = z
  .object({
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
  })
  .brand('timepoint');
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
  .brand('multidimensional_acquisition')
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

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const ObjectiveKubeStateSchema = z
  .object({
    kube_id: z.string(),
    slot_id: z.number(),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the objective lens (e.g., 'Plan-Apochromat 63x/1.4 Oil DIC M27') */
    model_name: z
      .string()
      .describe(
        "Model name of the objective lens (e.g., 'Plan-Apochromat 63x/1.4 Oil DIC M27')",
      )
      .optional(),
    /** Path to a file containing the physical model of the objective lens */
    model_file: z
      .string()
      .describe(
        'Path to a file containing the physical model of the objective lens',
      )
      .optional(),
  })
  .brand('objective_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type ObjectiveKubeState = z.infer<typeof ObjectiveKubeStateSchema>;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const DetectorKubeStateSchema = z
  .object({
    kube_id: z.string(),
    gain: z.number(),
    exposure_time: z.number(),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the detector (e.g., 'Pco Edge 4.2m') */
    model_name: z
      .string()
      .describe("Model name of the detector (e.g., 'Pco Edge 4.2m')")
      .optional(),
    /** Path to a file containing the physical model of the detector */
    model_file: z
      .string()
      .describe('Path to a file containing the physical model of the detector')
      .optional(),
  })
  .brand('detector_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type DetectorKubeState = z.infer<typeof DetectorKubeStateSchema>;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const FilterKubeStateSchema = z
  .object({
    kube_id: z.string(),
    wavelength: z.number(),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the objective lens (e.g., 'Plan-Apochromat 63x/1.4 Oil DIC M27') */
    model_name: z
      .string()
      .describe(
        "Model name of the objective lens (e.g., 'Plan-Apochromat 63x/1.4 Oil DIC M27')",
      )
      .optional(),
    /** Path to a file containing the physical model of the objective lens */
    model_file: z
      .string()
      .describe(
        'Path to a file containing the physical model of the objective lens',
      )
      .optional(),
  })
  .brand('filter_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type FilterKubeState = z.infer<typeof FilterKubeStateSchema>;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const IlluminationKubeStateSchema = z
  .object({
    kube_id: z.string(),
    slot_id: z.number(),
    intensity: z.number(),
    wavelength: z.number(),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the objective lens (e.g., 'Plan-Apochromat 63x/1.4 Oil DIC M27') */
    model_name: z
      .string()
      .describe(
        "Model name of the objective lens (e.g., 'Plan-Apochromat 63x/1.4 Oil DIC M27')",
      )
      .optional(),
    /** Path to a file containing the physical model of the objective lens */
    model_file: z
      .string()
      .describe(
        'Path to a file containing the physical model of the objective lens',
      )
      .optional(),
  })
  .brand('illumination_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type IlluminationKubeState = z.infer<typeof IlluminationKubeStateSchema>;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const GenericKubeStateSchema = z
  .object({
    kube_id: z.string(),
    other_metadata: z.record(z.string(), z.string()),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the stage (e.g., 'Stage 100x/0.8 NA') */
    model_name: z
      .string()
      .describe("Model name of the stage (e.g., 'Stage 100x/0.8 NA')")
      .optional(),
    /** Path to a file containing the physical model of the stage */
    model_file: z
      .string()
      .describe('Path to a file containing the physical model of the stage')
      .optional(),
  })
  .brand('generic_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type GenericKubeState = z.infer<typeof GenericKubeStateSchema>;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const StageKubeStateSchema = z
  .object({
    kube_id: z.string(),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the stage (e.g., 'Stage 100x/0.8 NA') */
    model_name: z
      .string()
      .describe("Model name of the stage (e.g., 'Stage 100x/0.8 NA')")
      .optional(),
    /** Path to a file containing the physical model of the stage */
    model_file: z
      .string()
      .describe('Path to a file containing the physical model of the stage')
      .optional(),
  })
  .brand('stage_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type StageKubeState = z.infer<typeof StageKubeStateSchema>;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const DichroicKubeStateSchema = z
  .object({
    kube_id: z.string(),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the dichroic mirror (e.g., 'Dichroic 405/488/561/640 nm') */
    model_name: z
      .string()
      .describe(
        "Model name of the dichroic mirror (e.g., 'Dichroic 405/488/561/640 nm')",
      )
      .optional(),
    /** Path to a file containing the physical model of the dichroic mirror */
    model_file: z
      .string()
      .describe(
        'Path to a file containing the physical model of the dichroic mirror',
      )
      .optional(),
  })
  .brand('dichroic_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type DichroicKubeState = z.infer<typeof DichroicKubeStateSchema>;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const FilterBankKubeStateSchema = z
  .object({
    kube_id: z.string(),
    slot_id: z.number(),
    center_wavelength: z.number(),
    bandwidth: z.number(),
    transmission: z.number(),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the filter bank (e.g., 'Filter Bank 405/488/561/640 nm') */
    model_name: z
      .string()
      .describe(
        "Model name of the filter bank (e.g., 'Filter Bank 405/488/561/640 nm')",
      )
      .optional(),
    /** Path to a file containing the physical model of the objective lens */
    model_file: z
      .string()
      .describe(
        'Path to a file containing the physical model of the objective lens',
      )
      .optional(),
  })
  .brand('filter_bank_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type FilterBankKubeState = z.infer<typeof FilterBankKubeStateSchema>;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const ObjectiveTurretKubeStateSchema = z
  .object({
    kube_id: z.string(),
    slot: z.number(),
    magnification: z.number(),
    numerical_aperture: z.number(),
    /** Affine transformation matrix of the kube */
    affine_matrix: z
      .array(z.array(z.number()))
      .describe('Affine transformation matrix of the kube'),
    /** Model name of the objective turret (e.g., 'Objective Turret 40x/0.6 NA') */
    model_name: z
      .string()
      .describe(
        "Model name of the objective turret (e.g., 'Objective Turret 40x/0.6 NA')",
      )
      .optional(),
    /** Path to a file containing the physical model of the objective turret */
    model_file: z
      .string()
      .describe(
        'Path to a file containing the physical model of the objective turret',
      )
      .optional(),
  })
  .brand('objective_turret_kube_state');
/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export type ObjectiveTurretKubeState = z.infer<
  typeof ObjectiveTurretKubeStateSchema
>;

/** Data class representing the light path used for an image, including illumination settings. */
export const LightEdgeStateSchema = z
  .object({
    /** Source identifier (e.g., ID of LED or laser) */
    source: z.string().describe('Source identifier (e.g., ID of LED or laser)'),
    /** Target identifier (e.g., ID of sample or detector) */
    target: z
      .string()
      .describe('Target identifier (e.g., ID of sample or detector)'),
    /** Intensity of the light source (arbitrary units) */
    intensity: z
      .number()
      .describe('Intensity of the light source (arbitrary units)')
      .optional(),
    /** Polarization state of the light (e.g., 'linear', 'circular') */
    polarization: z
      .string()
      .describe("Polarization state of the light (e.g., 'linear', 'circular')")
      .optional(),
  })
  .brand('light_edge_state');
/** Data class representing the light path used for an image, including illumination settings. */
export type LightEdgeState = z.infer<typeof LightEdgeStateSchema>;

/** Data class representing the light path used for an image, including illumination settings. */
export const LightPathStateSchema = z
  .object({
    /** Hash of the light path configuration, used to uniquely describe the optical path for this image */
    hash: z
      .string()
      .describe(
        'Hash of the light path configuration, used to uniquely describe the optical path for this image',
      )
      .optional(),
    /** List of kubes representing the optical components in the light path (e.g., objective, detector) */
    kubes: z
      .array(
        z.union([
          ObjectiveKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          DetectorKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          FilterKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          IlluminationKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          GenericKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          StageKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          DichroicKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          FilterBankKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          ObjectiveTurretKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
        ]),
      )
      .describe(
        'List of kubes representing the optical components in the light path (e.g., objective, detector)',
      ),
    /** List of edges representing the light path from source to sample */
    edges: z
      .array(
        LightEdgeStateSchema.describe(
          'Data class representing the light path used for an image, including illumination settings.',
        ),
      )
      .describe(
        'List of edges representing the light path from source to sample',
      ),
    /** Hash indicating if the kube is affecting the transformation from sample to pixel coordinates, which is used to determine if we can reuse the affine matrix from a previous image */
    transformation_hash: z
      .string()
      .describe(
        'Hash indicating if the kube is affecting the transformation from sample to pixel coordinates, which is used to determine if we can reuse the affine matrix from a previous image',
      )
      .optional(),
  })
  .brand('light_path_state');
/** Data class representing the light path used for an image, including illumination settings. */
export type LightPathState = z.infer<typeof LightPathStateSchema>;

/** Data class representing metadata for an image, including its ID and affine transformation matrix. */
export const MetadataSchema = z
  .object({
    affine_matrix: z.array(z.array(z.number())),
    fov_width: z.number(),
    fov_height: z.number(),
    /** Data class representing the light path used for an image, including illumination settings. */
    light_state: LightPathStateSchema.describe(
      'Data class representing the light path used for an image, including illumination settings.',
    ),
    acquisition_time: z.string(),
    colormap: z.string().optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
  })
  .brand('metadata');
/** Data class representing metadata for an image, including its ID and affine transformation matrix. */
export type Metadata = z.infer<typeof MetadataSchema>;

/** Represents a single image captured by the detector. */
export const ImageSchema = z
  .object({
    id: z.string(),
    /** Data class representing metadata for an image, including its ID and affine transformation matrix. */
    metadata: MetadataSchema.describe(
      'Data class representing metadata for an image, including its ID and affine transformation matrix.',
    ),
  })
  .brand('image');
/** Represents a single image captured by the detector. */
export type Image = z.infer<typeof ImageSchema>;

// --- Schemas ---
export const AcquireMultidimensionalAcquisitionArgsSchema = z.object({
  /** Configuration for the acquisition. */
  config: MultidimensionalAcquisitionSchema.describe(
    'Configuration for the acquisition.',
  ),
});
export const AcquireMultidimensionalAcquisitionReturnSchema = z.object({
  /** List of acquired images with metadata. */
  return0: z
    .array(
      ImageSchema.describe(
        'Represents a single image captured by the detector.',
      ),
    )
    .describe('List of acquired images with metadata.'),
});

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
  appKey: 'default',
  description: '',
  argsSchema: AcquireMultidimensionalAcquisitionArgsSchema,
  returnSchema: AcquireMultidimensionalAcquisitionReturnSchema,
  lockKeys: [
    'camera_parameters',
    'expanse_state',
    'hook_registry',
    'illumination',
    'io',
    'stage_position',
  ],
};

/**
 * undefined
 */
export const useAcquireMultidimensionalAcquisition = () => {
  return useAction(AcquireMultidimensionalAcquisitionDefinition);
};
