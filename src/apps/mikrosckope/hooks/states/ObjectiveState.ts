import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const MikrosckopeObjectiveLensSchema = z
  .object({
    __brand: z.literal("objective_lens").default("objective_lens"),
    slot: z.number(),
    name: z.string(),
    magnification: z.number(),
    numerical_aperture: z.number(),
    working_distance: z.number(),
    binning_factor: z.number(),
  })
  .brand("objective_lens");
export const ObjectiveLensSchema = MikrosckopeObjectiveLensSchema;

// --- Main Schema ---
export const MikrosckopeObjectiveStateSchema = z.object({
  slot: z.number(),
  magnification: z.number(),
  name: z.string(),
  mounted_lenses: z.array(MikrosckopeObjectiveLensSchema),
});

// --- Type ---
export type MikrosckopeObjectiveState = z.infer<
  typeof MikrosckopeObjectiveStateSchema
>;

export const ObjectiveStateSchema = MikrosckopeObjectiveStateSchema;
export type ObjectiveState = MikrosckopeObjectiveState;

// --- Definition ---
export const MikrosckopeObjectiveStateDefinition: StateDefinition<
  MikrosckopeObjectiveState,
  "ObjectiveState"
> = {
  appKey: "mikrosckope",
  key: "ObjectiveState", // The ID used by the backend
  schema: MikrosckopeObjectiveStateSchema,
};

export const ObjectiveStateDefinition = MikrosckopeObjectiveStateDefinition;

/**
 * Hook to sync ObjectiveState
 */
export const useMikrosckopeObjectiveState =
  buildUseState<MikrosckopeObjectiveState>(MikrosckopeObjectiveStateDefinition);

export const useObjectiveState = useMikrosckopeObjectiveState;
