import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const SetGainArgsSchema = z.object({
  gain: z.number(),
});
export const SetGainReturnSchema = z.void();

// --- Types ---
export type SetGainArgs = z.infer<typeof SetGainArgsSchema>;
export type SetGainReturn = z.infer<typeof SetGainReturnSchema>;

// --- Definition ---
export const SetGainDefinition: ActionDefinition<SetGainArgs, SetGainReturn> = {
  name: "set_gain",
  description: "",
  argsSchema: SetGainArgsSchema,
  returnSchema: SetGainReturnSchema,
  lockKeys: ["camera_parameters"],
};

/**
 * undefined
 */
export const useSetGain = () => {
  return useTransportAction(SetGainDefinition);
};
