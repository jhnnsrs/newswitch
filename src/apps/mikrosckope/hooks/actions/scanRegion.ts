import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

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
export const MikrosckopeScanRegionArgsSchema = z.object({
  /** Defines the order in which stage positions are visited during acquisition. */
  scan_order: z
    .union([
      z
        .literal('SNAKE_ROW')
        .describe(
          'Defines the order in which stage positions are visited during acquisition.',
        ),
      z
        .literal('SNAKE_COL')
        .describe(
          'Defines the order in which stage positions are visited during acquisition.',
        ),
      z
        .literal('RASTER_ROW')
        .describe(
          'Defines the order in which stage positions are visited during acquisition.',
        ),
      z
        .literal('RASTER_COL')
        .describe(
          'Defines the order in which stage positions are visited during acquisition.',
        ),
    ])
    .describe(
      'Defines the order in which stage positions are visited during acquisition.',
    ),
  start_x: z.number(),
  start_y: z.number(),
  end_x: z.number(),
  end_y: z.number(),
  overlap: z.number().optional(),
  detector_slot: z.number().optional(),
});
export const MikrosckopeScanRegionReturnSchema = z.object({
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
export type MikrosckopeScanRegionArgs = z.infer<
  typeof MikrosckopeScanRegionArgsSchema
>;
export type MikrosckopeScanRegionReturn = z.infer<
  typeof MikrosckopeScanRegionReturnSchema
>;

export const ScanRegionArgsSchema = MikrosckopeScanRegionArgsSchema;
export const ScanRegionReturnSchema = MikrosckopeScanRegionReturnSchema;
export type ScanRegionArgs = MikrosckopeScanRegionArgs;
export type ScanRegionReturn = MikrosckopeScanRegionReturn;

// --- Definition ---
export const MikrosckopeScanRegionDefinition: ActionDefinition<
  MikrosckopeScanRegionArgs,
  MikrosckopeScanRegionReturn
> = {
  name: 'scan_region',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeScanRegionArgsSchema,
  returnSchema: MikrosckopeScanRegionReturnSchema,
  lockKeys: ['camera_parameters', 'expanse_state', 'io', 'stage_position'],
};

export const ScanRegionDefinition = MikrosckopeScanRegionDefinition;

/**
 * undefined
 */
export const useMikrosckopeScanRegion = () => {
  return useAction(MikrosckopeScanRegionDefinition);
};

export const useScanRegion = useMikrosckopeScanRegion;
