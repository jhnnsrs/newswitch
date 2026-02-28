import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

/** Data class representing metadata for an image, including its ID and affine transformation matrix. */
export const MetadataSchema = z
  .object({
    objective_id: z.string(),
    detector_id: z.string(),
    affine_matrix: z.array(z.array(z.number())),
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
