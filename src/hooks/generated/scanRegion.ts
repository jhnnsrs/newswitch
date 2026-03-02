import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

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
export const ScanRegionArgsSchema = z.object({
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
export const ScanRegionReturnSchema = z.object({
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
export type ScanRegionArgs = z.infer<typeof ScanRegionArgsSchema>;
export type ScanRegionReturn = z.infer<typeof ScanRegionReturnSchema>;

// --- Definition ---
export const ScanRegionDefinition: ActionDefinition<
  ScanRegionArgs,
  ScanRegionReturn
> = {
  name: 'scan_region',
  description: '',
  argsSchema: ScanRegionArgsSchema,
  returnSchema: ScanRegionReturnSchema,
  lockKeys: ['camera_parameters', 'expanse_state', 'io', 'stage_position'],
};

/**
 * undefined
 */
export const useScanRegion = () => {
  return useTransportAction(ScanRegionDefinition);
};
