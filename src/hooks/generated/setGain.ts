import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const SetGainArgsSchema = z.object({
  gain: z.number(),
});
export const SetGainReturnSchema = z.number();

// --- Types ---
export type SetGainArgs = z.infer<typeof SetGainArgsSchema>;
export type SetGainReturn = z.infer<typeof SetGainReturnSchema>;

// --- Definition ---
export const SetGainDefinition: ActionDefinition<SetGainArgs, SetGainReturn> = {
  name: "set_gain",
  description: "Set detector gain.",
  argsSchema: SetGainArgsSchema,
  returnSchema: SetGainReturnSchema,
};

/**
 * Set detector gain.
 */
export const useSetGain = () => {
  return useTransportAction(SetGainDefinition);
};
