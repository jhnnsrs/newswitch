import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

/** Represents which channels to acquire at each position. */
export const StreamsSchema = z.object({
  detector: z.string(),
  mapping: z.string(),
});
/** Represents which channels to acquire at each position. */
export type Streams = z.infer<typeof StreamsSchema>;

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
});
/** Represents a position in 3D space. */
export type Position = z.infer<typeof PositionSchema>;

/** Represents a timepoint in a temporal sequence. */
export const TimepointSchema = z.object({
  time: z.any(),
  positions: z.array(
    PositionSchema.describe('Represents a position in 3D space.'),
  ),
  position_order: z.string().optional(),
});
/** Represents a timepoint in a temporal sequence. */
export type Timepoint = z.infer<typeof TimepointSchema>;

/** Configuration for the acquisition. */
export const MultidimensionalAcquisitionSchema = z.object({
  /** Represents a timepoint in a temporal sequence. */
  timepoints: TimepointSchema.describe(
    'Represents a timepoint in a temporal sequence.',
  ),
  file_name: z.string(),
  file_format: z.string(),
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
  .record(z.string(), z.any())
  .describe('Simulated acquired image with metadata.');

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
  lockKeys: [],
};

/**
 * undefined
 */
export const useAcquireMultidimensionalAcquisition = () => {
  return useTransportAction(AcquireMultidimensionalAcquisitionDefinition);
};
