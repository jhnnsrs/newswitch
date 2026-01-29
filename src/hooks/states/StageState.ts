import { z } from "zod";
import {
  useStateSync,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

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
 */
export const useStageState = (options?: UseStateSyncOptions) => {
  return useStateSync<StageState>(StageStateDefinition, options);
};
