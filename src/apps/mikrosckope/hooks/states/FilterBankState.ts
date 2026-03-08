import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const MikrosckopeFilterSchema = z
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
export const FilterSchema = MikrosckopeFilterSchema;

// --- Main Schema ---
export const MikrosckopeFilterBankStateSchema = z.object({
  filters: z.array(MikrosckopeFilterSchema),
  current_slot: z.number(),
});

// --- Type ---
export type MikrosckopeFilterBankState = z.infer<
  typeof MikrosckopeFilterBankStateSchema
>;

export const FilterBankStateSchema = MikrosckopeFilterBankStateSchema;
export type FilterBankState = MikrosckopeFilterBankState;

// --- Definition ---
export const MikrosckopeFilterBankStateDefinition: StateDefinition<
  MikrosckopeFilterBankState,
  "FilterBankState"
> = {
  appKey: "mikrosckope",
  key: "FilterBankState", // The ID used by the backend
  schema: MikrosckopeFilterBankStateSchema,
};

export const FilterBankStateDefinition = MikrosckopeFilterBankStateDefinition;

/**
 * Hook to sync FilterBankState
 */
export const useMikrosckopeFilterBankState =
  buildUseState<MikrosckopeFilterBankState>(
    MikrosckopeFilterBankStateDefinition,
  );

export const useFilterBankState = useMikrosckopeFilterBankState;
