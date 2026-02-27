import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const ExpanseStateSchema = z.object({
  current_images: z.array(
    z
      .object({
        id: z.string(),
        metadata: z
          .object({
            objective_id: z.string(),
            affine_matrix: z.array(z.array(z.number())),
          })
          .brand("metadata"),
      })
      .brand("image"),
  ),
});

// --- Type ---
export type ExpanseState = z.infer<typeof ExpanseStateSchema>;

// --- Definition ---
export const ExpanseStateDefinition: StateDefinition<ExpanseState> = {
  key: "ExpanseState", // The ID used by the backend
  schema: ExpanseStateSchema,
};

/**
 * Hook to sync ExpanseState
 */
export const useExpanseState = buildUseState<ExpanseState>(
  ExpanseStateDefinition,
);
