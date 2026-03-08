import { z } from "zod";
import { buildUseState, type StateDefinition } from "../useStateSync";

// --- Sub-Schemas ---
export const MikrosckopeRegisteredHookSchema = z
  .object({
    __brand: z.literal("registered_hook").default("registered_hook"),
    type: z.string(),
  })
  .brand("registered_hook");
export const RegisteredHookSchema = MikrosckopeRegisteredHookSchema;

// --- Main Schema ---
export const MikrosckopeHookStateSchema = z.object({
  registered_hooks: z.array(MikrosckopeRegisteredHookSchema),
});

// --- Type ---
export type MikrosckopeHookState = z.infer<typeof MikrosckopeHookStateSchema>;

export const HookStateSchema = MikrosckopeHookStateSchema;
export type HookState = MikrosckopeHookState;

// --- Definition ---
export const MikrosckopeHookStateDefinition: StateDefinition<
  MikrosckopeHookState,
  "HookState"
> = {
  appKey: "mikrosckope",
  key: "HookState", // The ID used by the backend
  schema: MikrosckopeHookStateSchema,
};

export const HookStateDefinition = MikrosckopeHookStateDefinition;

/**
 * Hook to sync HookState
 */
export const useMikrosckopeHookState = buildUseState<MikrosckopeHookState>(
  MikrosckopeHookStateDefinition,
);

export const useHookState = useMikrosckopeHookState;
