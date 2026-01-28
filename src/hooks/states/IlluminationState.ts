import { z } from "zod";
import { useStateSync, type StateDefinition, type UseStateSyncOptions } from "../useStateSync";

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
 * @param options - Options for the state sync
 * @param options.subscribe - Whether to subscribe to real-time updates (default: false)
 * @param options.fetchOnMount - Whether to fetch initial state on mount (default: true)
 */
export const useIlluminationState = (options?: UseStateSyncOptions) => {
  return useStateSync<IlluminationState>(IlluminationStateDefinition, options);
};
