import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const ToggleObjectiveArgsSchema = z.object({});
export const ToggleObjectiveReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type ToggleObjectiveArgs = z.infer<typeof ToggleObjectiveArgsSchema>;
export type ToggleObjectiveReturn = z.infer<typeof ToggleObjectiveReturnSchema>;

// --- Definition ---
export const ToggleObjectiveDefinition: ActionDefinition<
  ToggleObjectiveArgs,
  ToggleObjectiveReturn
> = {
  name: "toggle_objective",
  description: "",
  argsSchema: ToggleObjectiveArgsSchema,
  returnSchema: ToggleObjectiveReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useToggleObjective = () => {
  return useTransportAction(ToggleObjectiveDefinition);
};
