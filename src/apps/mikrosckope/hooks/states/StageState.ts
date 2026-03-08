import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---

// --- Main Schema ---
export const MikrosckopeStageStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  a: z.number(),
  max_x: z.number(),
  min_x: z.number(),
  max_y: z.number(),
  min_y: z.number(),
  max_z: z.number(),
  min_z: z.number(),
  max_a: z.number(),
  min_a: z.number(),
  registered_step_sizes: z.array(z.number()),
});

// --- Type ---
export type MikrosckopeStageState = z.infer<typeof MikrosckopeStageStateSchema>;

export const StageStateSchema = MikrosckopeStageStateSchema;
export type StageState = MikrosckopeStageState;

// --- Definition ---
export const MikrosckopeStageStateDefinition: StateDefinition<
  MikrosckopeStageState,
  "StageState"
> = {
  appKey: "mikrosckope",
  key: "StageState", // The ID used by the backend
  schema: MikrosckopeStageStateSchema,
};

export const StageStateDefinition = MikrosckopeStageStateDefinition;

/**
 * Hook to sync StageState
 */
export const useMikrosckopeStageState = buildUseState<MikrosckopeStageState>(
  MikrosckopeStageStateDefinition,
);

export const useStageState = useMikrosckopeStageState;
