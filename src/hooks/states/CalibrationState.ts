import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const CalibrationStateSchema = z.object({
  affine_states: z.array(
    z
      .object({
        affine_matrix: z.array(z.array(z.number())),
        objective_slot: z.number(),
        detector_slot: z.number(),
      })
      .brand("affine_state"),
  ),
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
