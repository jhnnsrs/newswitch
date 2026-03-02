import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const CalibratedLightPathSchema = z
  .object({
    __brand: z
      .literal("calibrated_light_path")
      .default("calibrated_light_path"),
    affine_matrix: z.array(z.array(z.number())),
    fov_width: z.number(),
    fov_height: z.number(),
    light_path_state_hash: z.string(),
  })
  .brand("calibrated_light_path");

// --- Main Schema ---
export const CalibrationStateSchema = z.object({
  calibrated_light_paths: z.array(CalibratedLightPathSchema),
});

// --- Type ---
export type CalibrationState = z.infer<typeof CalibrationStateSchema>;

// --- Definition ---
export const CalibrationStateDefinition: StateDefinition<CalibrationState> = {
  key: "CalibrationState", // The ID used by the backend
  schema: CalibrationStateSchema,
};

/**
 * Hook to sync CalibrationState
 */
export const useCalibrationState = buildUseState<CalibrationState>(
  CalibrationStateDefinition,
);
