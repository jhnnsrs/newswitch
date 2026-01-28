import { z } from "zod";
import { useStateSync, type StateDefinition, type UseStateSyncOptions } from "../useStateSync";

// --- Schema ---
export const ObjectiveStateSchema = z.object({
  slot: z.number(),
  magnification: z.number(),
  name: z.string(),
});

// --- Type ---
export type ObjectiveState = z.infer<typeof ObjectiveStateSchema>;

// --- Definition ---
export const ObjectiveStateDefinition: StateDefinition<ObjectiveState> = {
  key: "ObjectiveState", // The ID used by the backend
  schema: ObjectiveStateSchema,
};

/**
 * Hook to sync ObjectiveState
 * @param options - Options for the state sync
 * @param options.subscribe - Whether to subscribe to real-time updates (default: false)
 * @param options.fetchOnMount - Whether to fetch initial state on mount (default: true)
 */
export const useObjectiveState = (options?: UseStateSyncOptions) => {
  return useStateSync<ObjectiveState>(ObjectiveStateDefinition, options);
};
