import { z } from "zod";
import {
  useStateSync,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const ObjectiveStateSchema = z.object({
  slot: z.number(),
  magnification: z.number(),
  name: z.string(),
  mounted_lenses: z.array(
    z.object({
      slot: z.number(),
      name: z.string(),
      magnification: z.number(),
      numerical_aperture: z.number(),
      working_distance: z.number(),
      binning_factor: z.number(),
    }),
  ),
});

// --- Type ---
export type ObjectiveState = z.infer<typeof ObjectiveStateSchema>;

// --- Definition ---
export const ObjectiveStateDefinition: StateDefinition<ObjectiveState> = {
  key: "ObjectiveState", // The ID used by the backend
  schema: ObjectiveStateSchema,
};

/**
 * Hook to sync ObjectiveState
 */
export const useObjectiveState = (options?: UseStateSyncOptions) => {
  return useStateSync<ObjectiveState>(ObjectiveStateDefinition, options);
};
