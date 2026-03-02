import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";
import { createIndexedUnion } from "./utils";

// --- Sub-Schemas ---
export const ObjectiveKubeSchema = z
  .object({
    __brand: z.literal("objective_kube").default("objective_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("objective_kube");

export const DetectorKubeSchema = z
  .object({
    __brand: z.literal("detector_kube").default("detector_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("detector_kube");

export const FilterKubeSchema = z
  .object({
    __brand: z.literal("filter_kube").default("filter_kube"),
    kube_id: z.string(),
    wavelength: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("filter_kube");

export const IlluminationKubeSchema = z
  .object({
    __brand: z.literal("illumination_kube").default("illumination_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("illumination_kube");

export const GenericKubeSchema = z
  .object({
    __brand: z.literal("generic_kube").default("generic_kube"),
    kube_id: z.string(),
    other_metadata: z.record(z.string(), z.string()),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("generic_kube");

export const StageKubeSchema = z
  .object({
    __brand: z.literal("stage_kube").default("stage_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("stage_kube");

export const DichroicKubeSchema = z
  .object({
    __brand: z.literal("dichroic_kube").default("dichroic_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("dichroic_kube");

export const FilterBankKubeSchema = z
  .object({
    __brand: z.literal("filter_bank_kube").default("filter_bank_kube"),
    kube_id: z.string(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("filter_bank_kube");

export const ObjectiveTurretKubeSchema = z
  .object({
    __brand: z
      .literal("objective_turret_kube")
      .default("objective_turret_kube"),
    kube_id: z.string(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("objective_turret_kube");

export const KubeUnionSchema = createIndexedUnion([
  ObjectiveKubeSchema,
  DetectorKubeSchema,
  FilterKubeSchema,
  IlluminationKubeSchema,
  GenericKubeSchema,
  StageKubeSchema,
  DichroicKubeSchema,
  FilterBankKubeSchema,
  ObjectiveTurretKubeSchema,
]);

export const LightEdgeSchema = z
  .object({
    __brand: z.literal("light_edge").default("light_edge"),
    source: z.string(),
    target: z.string(),
    intensity: z.number().nullable(),
  })
  .brand("light_edge");

export const LightPathSchema = z
  .object({
    __brand: z.literal("light_path").default("light_path"),
    detector: z.number(),
    kubes: z.array(KubeUnionSchema),
    edges: z.array(LightEdgeSchema),
  })
  .brand("light_path");

// --- Main Schema ---
export const LightPathStateSchema = z.object({
  light_paths: z.array(LightPathSchema),
  current_light_path: LightPathSchema.nullable(),
});

// --- Type ---
export type LightPathState = z.infer<typeof LightPathStateSchema>;

// --- Definition ---
export const LightPathStateDefinition: StateDefinition<LightPathState> = {
  key: "LightPathState", // The ID used by the backend
  schema: LightPathStateSchema,
};

/**
 * Hook to sync LightPathState
 */
export const useLightPathState = buildUseState<LightPathState>(
  LightPathStateDefinition,
);
