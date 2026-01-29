import { z } from "zod";
import {
  useStateSync,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const IlluminationStateSchema = z.object({
  intensity: z.number(),
  wavelength: z.number(),
  channel: z.number(),
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
export const useIlluminationState = (options?: UseStateSyncOptions) => {
  return useStateSync<IlluminationState>(IlluminationStateDefinition, options);
};
