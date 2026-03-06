import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const ObjectiveLensSchema = z
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

// --- Main Schema ---
export const ObjectiveStateSchema = z.object({
  slot: z.number(),
  magnification: z.number(),
  name: z.string(),
  mounted_lenses: z.array(ObjectiveLensSchema),
});

// --- Type ---
export type ObjectiveState = z.infer<typeof ObjectiveStateSchema>;

// --- Definition ---
export const ObjectiveStateDefinition: StateDefinition<
  ObjectiveState,
  "ObjectiveState"
> = {
  key: "ObjectiveState", // The ID used by the backend
  schema: ObjectiveStateSchema,
};

/**
 * Hook to sync ObjectiveState
 */
export const useObjectiveState = buildUseState<ObjectiveState>(
  ObjectiveStateDefinition,
);
