import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

// --- Schemas ---
export const SwitchObjectiveArgsSchema = z.object({
  slot: z.number(),
});
export const SwitchObjectiveReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type SwitchObjectiveArgs = z.infer<typeof SwitchObjectiveArgsSchema>;
export type SwitchObjectiveReturn = z.infer<typeof SwitchObjectiveReturnSchema>;

// --- Definition ---
export const SwitchObjectiveDefinition: ActionDefinition<
  SwitchObjectiveArgs,
  SwitchObjectiveReturn
> = {
  name: "switch_objective",
  description: "Switch to a specific objective slot.",
  argsSchema: SwitchObjectiveArgsSchema,
  returnSchema: SwitchObjectiveReturnSchema,
};

/**
 * Switch to a specific objective slot.
 */
export const useSwitchObjective = () => {
  return useAction(SwitchObjectiveDefinition);
};
