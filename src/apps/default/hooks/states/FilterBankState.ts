import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const FilterSchema = z
  .object({
    __brand: z.literal("filter").default("filter"),
    slot: z.number(),
    name: z.string(),
    center_wavelength: z.number(),
    bandwidth: z.number(),
    transmission: z.number(),
    is_active: z.boolean(),
  })
  .brand("filter");

// --- Main Schema ---
export const FilterBankStateSchema = z.object({
  filters: z.array(FilterSchema),
  current_slot: z.number(),
});

// --- Type ---
export type FilterBankState = z.infer<typeof FilterBankStateSchema>;

// --- Definition ---
export const FilterBankStateDefinition: StateDefinition<
  FilterBankState,
  "FilterBankState"
> = {
  appKey: "default",
  key: "FilterBankState", // The ID used by the backend
  schema: FilterBankStateSchema,
};

/**
 * Hook to sync FilterBankState
 */
export const useFilterBankState = buildUseState<FilterBankState>(
  FilterBankStateDefinition,
);
