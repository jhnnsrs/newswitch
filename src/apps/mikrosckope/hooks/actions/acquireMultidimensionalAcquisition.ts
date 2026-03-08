import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

/** Represents an illumination channel to acquire. */
export const MikrosckopeIlluminationSchema = z
  .object({
    source: z.string(),
    wavelength: z.number(),
    intensity: z.number(),
  })
  .brand('illumination');
/** Represents an illumination channel to acquire. */
export type MikrosckopeIllumination = z.infer<
  typeof MikrosckopeIlluminationSchema
>;
export const IlluminationSchema = MikrosckopeIlluminationSchema;
export type Illumination = MikrosckopeIllumination;

/** Represents which channels to acquire at each position. */
export const MikrosckopeStreamsSchema = z
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
        MikrosckopeIlluminationSchema.describe(
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
export type MikrosckopeStreams = z.infer<typeof MikrosckopeStreamsSchema>;
export const StreamsSchema = MikrosckopeStreamsSchema;
export type Streams = MikrosckopeStreams;

/** Data class representing a software autofocus hook to be executed during acquisition. */
export const MikrosckopeSoftwareAutofocusHookSchema = z
  .object({
    speed: z.number().optional(),
  })
  .brand('software_autofocus_hook');
/** Data class representing a software autofocus hook to be executed during acquisition. */
export type MikrosckopeSoftwareAutofocusHook = z.infer<
  typeof MikrosckopeSoftwareAutofocusHookSchema
>;
export const SoftwareAutofocusHookSchema =
  MikrosckopeSoftwareAutofocusHookSchema;
export type SoftwareAutofocusHook = MikrosckopeSoftwareAutofocusHook;

/** Data class representing a z-calibration hook to be executed during acquisition. */
export const MikrosckopeZCalibrationHookSchema = z
  .object({
    calibration_points: z.number().optional(),
  })
  .brand('z_calibration_hook');
/** Data class representing a z-calibration hook to be executed during acquisition. */
export type MikrosckopeZCalibrationHook = z.infer<
  typeof MikrosckopeZCalibrationHookSchema
>;
export const ZCalibrationHookSchema = MikrosckopeZCalibrationHookSchema;
export type ZCalibrationHook = MikrosckopeZCalibrationHook;

/** Represents a stack of images at different z-slices. */
export const MikrosckopeStackSchema = z
  .object({
    z_offset: z.number(),
    z_slices: z.array(z.number()),
    z_step: z.number(),
    channels: z.array(
      MikrosckopeStreamsSchema.describe(
        'Represents which channels to acquire at each position.',
      ),
    ),
    /** List of hooks to execute at each z-slice (e.g., 'autofocus', 'z_calibration') */
    z_hooks: z
      .array(
        z.union([
          MikrosckopeSoftwareAutofocusHookSchema.describe(
            'Data class representing a software autofocus hook to be executed during acquisition.',
          ),
          MikrosckopeZCalibrationHookSchema.describe(
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
export type MikrosckopeStack = z.infer<typeof MikrosckopeStackSchema>;
export const StackSchema = MikrosckopeStackSchema;
export type Stack = MikrosckopeStack;

/** Represents a position in 3D space. */
export const MikrosckopePositionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    stacks: z.array(
      MikrosckopeStackSchema.describe(
        'Represents a stack of images at different z-slices.',
      ),
    ),
    /** List of hooks to execute at each position (e.g., 'autofocus', 'z_calibration') */
    p_hooks: z
      .array(
        z.union([
          MikrosckopeSoftwareAutofocusHookSchema.describe(
            'Data class representing a software autofocus hook to be executed during acquisition.',
          ),
          MikrosckopeZCalibrationHookSchema.describe(
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
export type MikrosckopePosition = z.infer<typeof MikrosckopePositionSchema>;
export const PositionSchema = MikrosckopePositionSchema;
export type Position = MikrosckopePosition;

/** Represents a timepoint in a temporal sequence. */
export const MikrosckopeTimepointSchema = z
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
      .array(
        MikrosckopePositionSchema.describe(
          'Represents a position in 3D space.',
        ),
      )
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
          MikrosckopeSoftwareAutofocusHookSchema.describe(
            'Data class representing a software autofocus hook to be executed during acquisition.',
          ),
          MikrosckopeZCalibrationHookSchema.describe(
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
export type MikrosckopeTimepoint = z.infer<typeof MikrosckopeTimepointSchema>;
export const TimepointSchema = MikrosckopeTimepointSchema;
export type Timepoint = MikrosckopeTimepoint;

/** Configuration for the acquisition. */
export const MikrosckopeMultidimensionalAcquisitionSchema = z
  .object({
    /** List of timepoints to acquire, each with its own stage positions and hooks */
    timepoints: z
      .array(
        MikrosckopeTimepointSchema.describe(
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
          MikrosckopeSoftwareAutofocusHookSchema.describe(
            'Data class representing a software autofocus hook to be executed during acquisition.',
          ),
          MikrosckopeZCalibrationHookSchema.describe(
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
export type MikrosckopeMultidimensionalAcquisition = z.infer<
  typeof MikrosckopeMultidimensionalAcquisitionSchema
>;
export const MultidimensionalAcquisitionSchema =
  MikrosckopeMultidimensionalAcquisitionSchema;
export type MultidimensionalAcquisition =
  MikrosckopeMultidimensionalAcquisition;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeObjectiveKubeStateSchema = z
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
export type MikrosckopeObjectiveKubeState = z.infer<
  typeof MikrosckopeObjectiveKubeStateSchema
>;
export const ObjectiveKubeStateSchema = MikrosckopeObjectiveKubeStateSchema;
export type ObjectiveKubeState = MikrosckopeObjectiveKubeState;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeDetectorKubeStateSchema = z
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
export type MikrosckopeDetectorKubeState = z.infer<
  typeof MikrosckopeDetectorKubeStateSchema
>;
export const DetectorKubeStateSchema = MikrosckopeDetectorKubeStateSchema;
export type DetectorKubeState = MikrosckopeDetectorKubeState;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeFilterKubeStateSchema = z
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
export type MikrosckopeFilterKubeState = z.infer<
  typeof MikrosckopeFilterKubeStateSchema
>;
export const FilterKubeStateSchema = MikrosckopeFilterKubeStateSchema;
export type FilterKubeState = MikrosckopeFilterKubeState;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeIlluminationKubeStateSchema = z
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
export type MikrosckopeIlluminationKubeState = z.infer<
  typeof MikrosckopeIlluminationKubeStateSchema
>;
export const IlluminationKubeStateSchema =
  MikrosckopeIlluminationKubeStateSchema;
export type IlluminationKubeState = MikrosckopeIlluminationKubeState;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeGenericKubeStateSchema = z
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
export type MikrosckopeGenericKubeState = z.infer<
  typeof MikrosckopeGenericKubeStateSchema
>;
export const GenericKubeStateSchema = MikrosckopeGenericKubeStateSchema;
export type GenericKubeState = MikrosckopeGenericKubeState;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeStageKubeStateSchema = z
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
export type MikrosckopeStageKubeState = z.infer<
  typeof MikrosckopeStageKubeStateSchema
>;
export const StageKubeStateSchema = MikrosckopeStageKubeStateSchema;
export type StageKubeState = MikrosckopeStageKubeState;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeDichroicKubeStateSchema = z
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
export type MikrosckopeDichroicKubeState = z.infer<
  typeof MikrosckopeDichroicKubeStateSchema
>;
export const DichroicKubeStateSchema = MikrosckopeDichroicKubeStateSchema;
export type DichroicKubeState = MikrosckopeDichroicKubeState;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeFilterBankKubeStateSchema = z
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
export type MikrosckopeFilterBankKubeState = z.infer<
  typeof MikrosckopeFilterBankKubeStateSchema
>;
export const FilterBankKubeStateSchema = MikrosckopeFilterBankKubeStateSchema;
export type FilterBankKubeState = MikrosckopeFilterBankKubeState;

/** Data class representing metadata for a kube, including its ID and affine transformation matrix. */
export const MikrosckopeObjectiveTurretKubeStateSchema = z
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
export type MikrosckopeObjectiveTurretKubeState = z.infer<
  typeof MikrosckopeObjectiveTurretKubeStateSchema
>;
export const ObjectiveTurretKubeStateSchema =
  MikrosckopeObjectiveTurretKubeStateSchema;
export type ObjectiveTurretKubeState = MikrosckopeObjectiveTurretKubeState;

/** Data class representing the light path used for an image, including illumination settings. */
export const MikrosckopeLightEdgeStateSchema = z
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
export type MikrosckopeLightEdgeState = z.infer<
  typeof MikrosckopeLightEdgeStateSchema
>;
export const LightEdgeStateSchema = MikrosckopeLightEdgeStateSchema;
export type LightEdgeState = MikrosckopeLightEdgeState;

/** Data class representing the light path used for an image, including illumination settings. */
export const MikrosckopeLightPathStateSchema = z
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
          MikrosckopeObjectiveKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          MikrosckopeDetectorKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          MikrosckopeFilterKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          MikrosckopeIlluminationKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          MikrosckopeGenericKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          MikrosckopeStageKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          MikrosckopeDichroicKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          MikrosckopeFilterBankKubeStateSchema.describe(
            'Data class representing metadata for a kube, including its ID and affine transformation matrix.',
          ),
          MikrosckopeObjectiveTurretKubeStateSchema.describe(
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
        MikrosckopeLightEdgeStateSchema.describe(
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
export type MikrosckopeLightPathState = z.infer<
  typeof MikrosckopeLightPathStateSchema
>;
export const LightPathStateSchema = MikrosckopeLightPathStateSchema;
export type LightPathState = MikrosckopeLightPathState;

/** Data class representing metadata for an image, including its ID and affine transformation matrix. */
export const MikrosckopeMetadataSchema = z
  .object({
    affine_matrix: z.array(z.array(z.number())),
    fov_width: z.number(),
    fov_height: z.number(),
    /** Data class representing the light path used for an image, including illumination settings. */
    light_state: MikrosckopeLightPathStateSchema.describe(
      'Data class representing the light path used for an image, including illumination settings.',
    ),
    acquisition_time: z.string(),
    colormap: z.string().optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
  })
  .brand('metadata');
/** Data class representing metadata for an image, including its ID and affine transformation matrix. */
export type MikrosckopeMetadata = z.infer<typeof MikrosckopeMetadataSchema>;
export const MetadataSchema = MikrosckopeMetadataSchema;
export type Metadata = MikrosckopeMetadata;

/** Represents a single image captured by the detector. */
export const MikrosckopeImageSchema = z
  .object({
    id: z.string(),
    /** Data class representing metadata for an image, including its ID and affine transformation matrix. */
    metadata: MikrosckopeMetadataSchema.describe(
      'Data class representing metadata for an image, including its ID and affine transformation matrix.',
    ),
  })
  .brand('image');
/** Represents a single image captured by the detector. */
export type MikrosckopeImage = z.infer<typeof MikrosckopeImageSchema>;
export const ImageSchema = MikrosckopeImageSchema;
export type Image = MikrosckopeImage;

// --- Schemas ---
export const MikrosckopeAcquireMultidimensionalAcquisitionArgsSchema = z.object(
  {
    /** Configuration for the acquisition. */
    config: MikrosckopeMultidimensionalAcquisitionSchema.describe(
      'Configuration for the acquisition.',
    ),
  },
);
export const MikrosckopeAcquireMultidimensionalAcquisitionReturnSchema =
  z.object({
    /** List of acquired images with metadata. */
    return0: z
      .array(
        MikrosckopeImageSchema.describe(
          'Represents a single image captured by the detector.',
        ),
      )
      .describe('List of acquired images with metadata.'),
  });

// --- Types ---
export type MikrosckopeAcquireMultidimensionalAcquisitionArgs = z.infer<
  typeof MikrosckopeAcquireMultidimensionalAcquisitionArgsSchema
>;
export type MikrosckopeAcquireMultidimensionalAcquisitionReturn = z.infer<
  typeof MikrosckopeAcquireMultidimensionalAcquisitionReturnSchema
>;

export const AcquireMultidimensionalAcquisitionArgsSchema =
  MikrosckopeAcquireMultidimensionalAcquisitionArgsSchema;
export const AcquireMultidimensionalAcquisitionReturnSchema =
  MikrosckopeAcquireMultidimensionalAcquisitionReturnSchema;
export type AcquireMultidimensionalAcquisitionArgs =
  MikrosckopeAcquireMultidimensionalAcquisitionArgs;
export type AcquireMultidimensionalAcquisitionReturn =
  MikrosckopeAcquireMultidimensionalAcquisitionReturn;

// --- Definition ---
export const MikrosckopeAcquireMultidimensionalAcquisitionDefinition: ActionDefinition<
  MikrosckopeAcquireMultidimensionalAcquisitionArgs,
  MikrosckopeAcquireMultidimensionalAcquisitionReturn
> = {
  name: 'acquire_multidimensional_acquisition',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeAcquireMultidimensionalAcquisitionArgsSchema,
  returnSchema: MikrosckopeAcquireMultidimensionalAcquisitionReturnSchema,
  lockKeys: [
    'camera_parameters',
    'expanse_state',
    'hook_registry',
    'illumination',
    'io',
    'stage_position',
  ],
};

export const AcquireMultidimensionalAcquisitionDefinition =
  MikrosckopeAcquireMultidimensionalAcquisitionDefinition;

/**
 * undefined
 */
export const useMikrosckopeAcquireMultidimensionalAcquisition = () => {
  return useAction(MikrosckopeAcquireMultidimensionalAcquisitionDefinition);
};

export const useAcquireMultidimensionalAcquisition =
  useMikrosckopeAcquireMultidimensionalAcquisition;
