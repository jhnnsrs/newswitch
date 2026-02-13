import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const FilterBankStateSchema = z.object({
  filters: z.array(
    z
      .object({
        slot: z.number(),
        name: z.string(),
        center_wavelength: z.number(),
        bandwidth: z.number(),
        transmission: z.number(),
        is_active: z.boolean(),
      })
      .brand("filter"),
  ),
  current_slot: z.number(),
});

// --- Type ---
export type FilterBankState = z.infer<typeof FilterBankStateSchema>;

// --- Definition ---
export const FilterBankStateDefinition: StateDefinition<FilterBankState> = {
  key: "FilterBankState", // The ID used by the backend
  schema: FilterBankStateSchema,
};

/**
 * Hook to sync FilterBankState
 */
export const useFilterBankState = buildUseState<FilterBankState>(
  FilterBankStateDefinition,
);
