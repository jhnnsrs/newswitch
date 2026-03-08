import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const MikrosckopeCalibratedLightPathSchema = z
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
export const CalibratedLightPathSchema = MikrosckopeCalibratedLightPathSchema;

// --- Main Schema ---
export const MikrosckopeCalibrationStateSchema = z.object({
  calibrated_light_paths: z.array(MikrosckopeCalibratedLightPathSchema),
});

// --- Type ---
export type MikrosckopeCalibrationState = z.infer<
  typeof MikrosckopeCalibrationStateSchema
>;

export const CalibrationStateSchema = MikrosckopeCalibrationStateSchema;
export type CalibrationState = MikrosckopeCalibrationState;

// --- Definition ---
export const MikrosckopeCalibrationStateDefinition: StateDefinition<
  MikrosckopeCalibrationState,
  "CalibrationState"
> = {
  appKey: "mikrosckope",
  key: "CalibrationState", // The ID used by the backend
  schema: MikrosckopeCalibrationStateSchema,
};

export const CalibrationStateDefinition = MikrosckopeCalibrationStateDefinition;

/**
 * Hook to sync CalibrationState
 */
export const useMikrosckopeCalibrationState =
  buildUseState<MikrosckopeCalibrationState>(
    MikrosckopeCalibrationStateDefinition,
  );

export const useCalibrationState = useMikrosckopeCalibrationState;
