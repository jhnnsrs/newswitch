import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const IlluminationStateSchema = z.object({
  available_sources: z.array(
    z.object({
      kind: z.string(),
      slot: z.number(),
      intensity: z.number(),
      wavelength: z.number(),
      channel: z.number(),
      max_intensity: z.number(),
      min_intensity: z.number(),
    }),
  ),
  active_illuminations: z.array(
    z.object({
      slot: z.number(),
      intensity: z.number(),
    }),
  ),
});

// --- Type ---
export type IlluminationState = z.infer<typeof IlluminationStateSchema>;

// --- Definition ---
export const IlluminationStateDefinition: StateDefinition<IlluminationState> = {
  key: "IlluminationState", // The ID used by the backend
  schema: IlluminationStateSchema,
};

/**
 * Hook to sync IlluminationState
 */
export const useIlluminationState = buildUseState<IlluminationState>(
  IlluminationStateDefinition,
);
