import { z } from "zod";
import {
  buildUseState,
  type StateDefinition,
  type UseStateSyncOptions,
} from "../useStateSync";

// --- Schema ---
export const HookStateSchema = z.object({
  registered_hooks: z.array(
    z.object({
      type: z.string(),
    }),
  ),
});

// --- Type ---
export type HookState = z.infer<typeof HookStateSchema>;

// --- Definition ---
export const HookStateDefinition: StateDefinition<HookState> = {
  key: "HookState", // The ID used by the backend
  schema: HookStateSchema,
};

/**
 * Hook to sync HookState
 */
export const useHookState = buildUseState<HookState>(HookStateDefinition);
