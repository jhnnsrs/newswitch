import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const MikrosckopeDetectorSchema = z
  .object({
    __brand: z.literal("detector").default("detector"),
    slot: z.number(),
    name: z.string(),
    width: z.number(),
    height: z.number(),
    is_active: z.boolean(),
    current_exposure_time: z.number(),
    current_gain: z.number(),
    current_colormap: z.string(),
    pixel_size_um: z.number(),
    preset_exposure_times: z.array(z.number()),
    max_exposure_time: z.number(),
    min_exposure_time: z.number(),
    max_gain: z.number(),
    min_gain: z.number(),
    is_acquiring: z.boolean(),
    data_type: z.string(),
  })
  .brand("detector");
export const DetectorSchema = MikrosckopeDetectorSchema;

// --- Main Schema ---
export const MikrosckopeCameraStateSchema = z.object({
  is_acquiring: z.boolean(),
  detectors: z.array(MikrosckopeDetectorSchema),
});

// --- Type ---
export type MikrosckopeCameraState = z.infer<
  typeof MikrosckopeCameraStateSchema
>;

export const CameraStateSchema = MikrosckopeCameraStateSchema;
export type CameraState = MikrosckopeCameraState;

// --- Definition ---
export const MikrosckopeCameraStateDefinition: StateDefinition<
  MikrosckopeCameraState,
  "CameraState"
> = {
  appKey: "mikrosckope",
  key: "CameraState", // The ID used by the backend
  schema: MikrosckopeCameraStateSchema,
};

export const CameraStateDefinition = MikrosckopeCameraStateDefinition;

/**
 * Hook to sync CameraState
 */
export const useMikrosckopeCameraState = buildUseState<MikrosckopeCameraState>(
  MikrosckopeCameraStateDefinition,
);

export const useCameraState = useMikrosckopeCameraState;
