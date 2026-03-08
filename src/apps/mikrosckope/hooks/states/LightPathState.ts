import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";
import { createIndexedUnion } from "./utils";

// --- Sub-Schemas ---
export const MikrosckopeObjectiveKubeSchema = z
  .object({
    __brand: z.literal("objective_kube").default("objective_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("objective_kube");
export const ObjectiveKubeSchema = MikrosckopeObjectiveKubeSchema;

export const MikrosckopeDetectorKubeSchema = z
  .object({
    __brand: z.literal("detector_kube").default("detector_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("detector_kube");
export const DetectorKubeSchema = MikrosckopeDetectorKubeSchema;

export const MikrosckopeFilterKubeSchema = z
  .object({
    __brand: z.literal("filter_kube").default("filter_kube"),
    kube_id: z.string(),
    wavelength: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("filter_kube");
export const FilterKubeSchema = MikrosckopeFilterKubeSchema;

export const MikrosckopeIlluminationKubeSchema = z
  .object({
    __brand: z.literal("illumination_kube").default("illumination_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("illumination_kube");
export const IlluminationKubeSchema = MikrosckopeIlluminationKubeSchema;

export const MikrosckopeGenericKubeSchema = z
  .object({
    __brand: z.literal("generic_kube").default("generic_kube"),
    kube_id: z.string(),
    other_metadata: z.record(z.string(), z.string()),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
    state_accessor: z.string().nullable(),
  })
  .brand("generic_kube");
export const GenericKubeSchema = MikrosckopeGenericKubeSchema;

export const MikrosckopeStageKubeSchema = z
  .object({
    __brand: z.literal("stage_kube").default("stage_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("stage_kube");
export const StageKubeSchema = MikrosckopeStageKubeSchema;

export const MikrosckopeDichroicKubeSchema = z
  .object({
    __brand: z.literal("dichroic_kube").default("dichroic_kube"),
    kube_id: z.string(),
    slot_id: z.number(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("dichroic_kube");
export const DichroicKubeSchema = MikrosckopeDichroicKubeSchema;

export const MikrosckopeFilterBankKubeSchema = z
  .object({
    __brand: z.literal("filter_bank_kube").default("filter_bank_kube"),
    kube_id: z.string(),
    affine_matrix: z.array(z.array(z.number())),
    model_name: z.string().nullable(),
    model_file: z.string().nullable(),
  })
  .brand("filter_bank_kube");
export const FilterBankKubeSchema = MikrosckopeFilterBankKubeSchema;

export const MikrosckopeObjectiveTurretKubeSchema = z
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
export const ObjectiveTurretKubeSchema = MikrosckopeObjectiveTurretKubeSchema;

export const MikrosckopeKubeUnionSchema = createIndexedUnion([
  MikrosckopeObjectiveKubeSchema,
  MikrosckopeDetectorKubeSchema,
  MikrosckopeFilterKubeSchema,
  MikrosckopeIlluminationKubeSchema,
  MikrosckopeGenericKubeSchema,
  MikrosckopeStageKubeSchema,
  MikrosckopeDichroicKubeSchema,
  MikrosckopeFilterBankKubeSchema,
  MikrosckopeObjectiveTurretKubeSchema,
]);
export const KubeUnionSchema = MikrosckopeKubeUnionSchema;

export const MikrosckopeLightEdgeSchema = z
  .object({
    __brand: z.literal("light_edge").default("light_edge"),
    source: z.string(),
    target: z.string(),
    intensity: z.number().nullable(),
  })
  .brand("light_edge");
export const LightEdgeSchema = MikrosckopeLightEdgeSchema;

export const MikrosckopeLightPathSchema = z
  .object({
    __brand: z.literal("light_path").default("light_path"),
    detector: z.number(),
    kubes: z.array(MikrosckopeKubeUnionSchema),
    edges: z.array(MikrosckopeLightEdgeSchema),
  })
  .brand("light_path");
export const LightPathSchema = MikrosckopeLightPathSchema;

// --- Main Schema ---
export const MikrosckopeLightPathStateSchema = z.object({
  light_paths: z.array(MikrosckopeLightPathSchema),
  current_light_path: MikrosckopeLightPathSchema.nullable(),
});

// --- Type ---
export type MikrosckopeLightPathState = z.infer<
  typeof MikrosckopeLightPathStateSchema
>;

export const LightPathStateSchema = MikrosckopeLightPathStateSchema;
export type LightPathState = MikrosckopeLightPathState;

// --- Definition ---
export const MikrosckopeLightPathStateDefinition: StateDefinition<
  MikrosckopeLightPathState,
  "LightPathState"
> = {
  appKey: "mikrosckope",
  key: "LightPathState", // The ID used by the backend
  schema: MikrosckopeLightPathStateSchema,
};

export const LightPathStateDefinition = MikrosckopeLightPathStateDefinition;

/**
 * Hook to sync LightPathState
 */
export const useMikrosckopeLightPathState =
  buildUseState<MikrosckopeLightPathState>(MikrosckopeLightPathStateDefinition);

export const useLightPathState = useMikrosckopeLightPathState;
