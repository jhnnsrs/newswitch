import { z } from "zod";
import { useStateSync, type StateDefinition, type UseStateSyncOptions } from "../useStateSync";

// --- Schema ---
export const StageStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  a: z.number(),
});

// --- Type ---
export type StageState = z.infer<typeof StageStateSchema>;

// --- Definition ---
export const StageStateDefinition: StateDefinition<StageState> = {
  key: "StageState", // The ID used by the backend
  schema: StageStateSchema,
};

/**
 * Hook to sync StageState
 * @param options - Options for the state sync
 * @param options.subscribe - Whether to subscribe to real-time updates (default: false)
 * @param options.fetchOnMount - Whether to fetch initial state on mount (default: true)
 */
export const useStageState = (options?: UseStateSyncOptions) => {
  return useStateSync<StageState>(StageStateDefinition, options);
};
