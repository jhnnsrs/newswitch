import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";
import { createIndexedUnion } from "./utils";

// --- Sub-Schemas ---
export const ObjectiveKubeStateSchema = z
  .object({
    __brand: z.literal("objective_kube_state").default("objective_kube_state"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("objective_kube_state");

export const DetectorKubeStateSchema = z
  .object({
    __brand: z.literal("detector_kube_state").default("detector_kube_state"),
    kube_id: z.string(),
    gain: z.number(),
    exposure_time: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("detector_kube_state");

export const FilterKubeStateSchema = z
  .object({
    __brand: z.literal("filter_kube_state").default("filter_kube_state"),
    kube_id: z.string(),
    wavelength: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("filter_kube_state");

export const IlluminationKubeStateSchema = z
  .object({
    __brand: z
      .literal("illumination_kube_state")
      .default("illumination_kube_state"),
    kube_id: z.string(),
    slot_id: z.number(),
    intensity: z.number(),
    wavelength: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("illumination_kube_state");

export const GenericKubeStateSchema = z
  .object({
    __brand: z.literal("generic_kube_state").default("generic_kube_state"),
    kube_id: z.string(),
    other_metadata: z.record(z.string(), z.string()),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("generic_kube_state");

export const StageKubeStateSchema = z
  .object({
    __brand: z.literal("stage_kube_state").default("stage_kube_state"),
    kube_id: z.string(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("stage_kube_state");

export const DichroicKubeStateSchema = z
  .object({
    __brand: z.literal("dichroic_kube_state").default("dichroic_kube_state"),
    kube_id: z.string(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("dichroic_kube_state");

export const FilterBankKubeStateSchema = z
  .object({
    __brand: z
      .literal("filter_bank_kube_state")
      .default("filter_bank_kube_state"),
    kube_id: z.string(),
    slot_id: z.number(),
    center_wavelength: z.number(),
    bandwidth: z.number(),
    transmission: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("filter_bank_kube_state");

export const ObjectiveTurretKubeStateSchema = z
  .object({
    __brand: z
      .literal("objective_turret_kube_state")
      .default("objective_turret_kube_state"),
    kube_id: z.string(),
    slot: z.number(),
    magnification: z.number(),
    numerical_aperture: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("objective_turret_kube_state");

export const KubeUnionSchema = createIndexedUnion([
  ObjectiveKubeStateSchema,
  DetectorKubeStateSchema,
  FilterKubeStateSchema,
  IlluminationKubeStateSchema,
  GenericKubeStateSchema,
  StageKubeStateSchema,
  DichroicKubeStateSchema,
  FilterBankKubeStateSchema,
  ObjectiveTurretKubeStateSchema,
]);

export const LightEdgeStateSchema = z
  .object({
    __brand: z.literal("light_edge_state").default("light_edge_state"),
    source: z.string(),
    target: z.string(),
    intensity: z.number().nullable(),
    polarization: z.string().nullable(),
  })
  .brand("light_edge_state");

export const LightPathStateSchema = z
  .object({
    __brand: z.literal("light_path_state").default("light_path_state"),
    hash: z.string(),
    kubes: z.array(KubeUnionSchema),
    edges: z.array(LightEdgeStateSchema),
    transformation_hash: z.string(),
  })
  .brand("light_path_state");

export const MetadataSchema = z
  .object({
    __brand: z.literal("metadata").default("metadata"),
    affine_matrix: z.array(z.array(z.number())),
    fov_width: z.number(),
    fov_height: z.number(),
    light_state: LightPathStateSchema,
    acquisition_time: z.string(),
    colormap: z.string(),
    min_value: z.number().nullable(),
    max_value: z.number().nullable(),
  })
  .brand("metadata");

export const ImageSchema = z
  .object({
    __brand: z.literal("image").default("image"),
    id: z.string(),
    metadata: MetadataSchema,
  })
  .brand("image");

export const ScaleSchema = z
  .object({
    __brand: z.literal("scale").default("scale"),
    x: z.number(),
    y: z.number(),
    z: z.number(),
    cached_id: z.string().nullable(),
    affine_matrix: z.array(z.array(z.number())).nullable(),
  })
  .brand("scale");

export const ArrayMetadataSchema = z
  .object({
    __brand: z.literal("array_metadata").default("array_metadata"),
    min_value: z.number(),
    max_value: z.number(),
  })
  .brand("array_metadata");

export const FrameSchema = z
  .object({
    __brand: z.literal("frame").default("frame"),
    id: z.string(),
    scales: z.array(ScaleSchema),
    metadata: MetadataSchema,
    array_metadata: ArrayMetadataSchema,
  })
  .brand("frame");

// --- Main Schema ---
export const ExpanseStateSchema = z.object({
  current_id: z.string(),
  current_images: z.array(ImageSchema),
  current_frames: z.array(FrameSchema),
});

// --- Type ---
export type ExpanseState = z.infer<typeof ExpanseStateSchema>;

// --- Definition ---
export const ExpanseStateDefinition: StateDefinition<
  ExpanseState,
  "ExpanseState"
> = {
  key: "ExpanseState", // The ID used by the backend
  schema: ExpanseStateSchema,
};

/**
 * Hook to sync ExpanseState
 */
export const useExpanseState = buildUseState<ExpanseState>(
  ExpanseStateDefinition,
);
