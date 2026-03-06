import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const IlluminationSchema = z
  .object({
    __brand: z.literal("illumination").default("illumination"),
    kind: z.string(),
    slot: z.number(),
    intensity: z.number(),
    wavelength: z.number(),
    fartface: z.number(),
    channel: z.number(),
    max_intensity: z.number(),
    min_intensity: z.number(),
    is_active: z.boolean(),
  })
  .brand("illumination");

// --- Main Schema ---
export const IlluminationStateSchema = z.object({
  illuminations: z.array(IlluminationSchema),
});

// --- Type ---
export type IlluminationState = z.infer<typeof IlluminationStateSchema>;

// --- Definition ---
export const IlluminationStateDefinition: StateDefinition<
  IlluminationState,
  "IlluminationState"
> = {
  key: "IlluminationState", // The ID used by the backend
  schema: IlluminationStateSchema,
};

/**
 * Hook to sync IlluminationState
 */
export const useIlluminationState = buildUseState<IlluminationState>(
  IlluminationStateDefinition,
);
