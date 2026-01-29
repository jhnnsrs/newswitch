import { z } from "zod";
import {
  useStateSync,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const CameraStateSchema = z.object({
  exposure_time: z.number(),
  gain: z.number(),
  frame_number: z.number(),
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
export const useCameraState = (options?: UseStateSyncOptions) => {
  return useStateSync<CameraState>(CameraStateDefinition, options);
};
