import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const CameraStateSchema = z.object({
  is_acquiring: z.boolean(),
  detectors: z.array(
    z.object({
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
    }),
  ),
});

// --- Type ---
export type CameraState = z.infer<typeof CameraStateSchema>;

// --- Definition ---
export const CameraStateDefinition: StateDefinition<CameraState> = {
  key: "CameraState", // The ID used by the backend
  schema: CameraStateSchema,
};

/**
 * Hook to sync CameraState
 */
export const useCameraState = buildUseState<CameraState>(CameraStateDefinition);
