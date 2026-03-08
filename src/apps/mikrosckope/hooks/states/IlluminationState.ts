import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const MikrosckopeIlluminationSchema = z
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
export const IlluminationSchema = MikrosckopeIlluminationSchema;

// --- Main Schema ---
export const MikrosckopeIlluminationStateSchema = z.object({
  illuminations: z.array(MikrosckopeIlluminationSchema),
});

// --- Type ---
export type MikrosckopeIlluminationState = z.infer<
  typeof MikrosckopeIlluminationStateSchema
>;

export const IlluminationStateSchema = MikrosckopeIlluminationStateSchema;
export type IlluminationState = MikrosckopeIlluminationState;

// --- Definition ---
export const MikrosckopeIlluminationStateDefinition: StateDefinition<
  MikrosckopeIlluminationState,
  "IlluminationState"
> = {
  appKey: "mikrosckope",
  key: "IlluminationState", // The ID used by the backend
  schema: MikrosckopeIlluminationStateSchema,
};

export const IlluminationStateDefinition =
  MikrosckopeIlluminationStateDefinition;

/**
 * Hook to sync IlluminationState
 */
export const useMikrosckopeIlluminationState =
  buildUseState<MikrosckopeIlluminationState>(
    MikrosckopeIlluminationStateDefinition,
  );

export const useIlluminationState = useMikrosckopeIlluminationState;
