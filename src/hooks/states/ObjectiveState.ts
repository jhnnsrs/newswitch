import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
} from "../useStateSync";
import { expandWithSchema } from "@/lib/expanders";

// --- Schema ---
export const ObjectiveStateSchema = z.object({
  slot: z.number(),
  magnification: z.number(),
  name: z.string(),
  mounted_lenses: z.array(
    z
      .object({
        slot: z.number(),
        name: z.string().brand("little_boy").meta({ brand: "little_boy" }),
        magnification: z.number(),
        numerical_aperture: z.number(),
        working_distance: z.number(),
        binning_factor: z.number(),
      })
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
export const useObjectiveState = buildUseState<ObjectiveState>(
  ObjectiveStateDefinition,
);



export const expanded = await expandWithSchema(
  {
    slot: 1,
    magnification: 10,
    name: "Objective 1",
    mounted_lenses: [
      {
        slot: 1,
        name: "Lens A",
        magnification: 2,
        numerical_aperture: 0.5,
        working_distance: 5,
        binning_factor: 1,
      },
    ],
  },
  ObjectiveStateSchema,
  {
    little_boy: async (val) => ({ val, fuck: "example" }), // Example expander for the branded 'name' field
  }
);

console.log(expanded);