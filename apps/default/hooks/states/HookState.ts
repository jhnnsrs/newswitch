import { z } from "zod";
import { buildUseState, type StateDefinition } from "@/lib/rekuest/state";

// --- Sub-Schemas ---
export const RegisteredHookSchema = z
  .object({
    __brand: z.literal("registered_hook").default("registered_hook"),
    type: z.string(),
  })
  .brand("registered_hook");

// --- Main Schema ---
export const HookStateSchema = z.object({
  registered_hooks: z.array(RegisteredHookSchema),
});

// --- Type ---
export type HookState = z.infer<typeof HookStateSchema>;

// --- Definition ---
export const HookStateDefinition: StateDefinition<HookState, "HookState"> = {
  appKey: "default",
  key: "HookState", // The ID used by the backend
  schema: HookStateSchema,
};

/**
 * Hook to sync HookState
 */
export const useHookState = buildUseState<HookState>(HookStateDefinition);
