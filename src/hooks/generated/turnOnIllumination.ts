import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const TurnOnIlluminationArgsSchema = z.object({
  channel: z.number().optional(),
  intensity: z.number().optional(),
});
export const TurnOnIlluminationReturnSchema = z.string();

// --- Types ---
export type TurnOnIlluminationArgs = z.infer<
  typeof TurnOnIlluminationArgsSchema
>;
export type TurnOnIlluminationReturn = z.infer<
  typeof TurnOnIlluminationReturnSchema
>;

// --- Definition ---
export const TurnOnIlluminationDefinition: ActionDefinition<
  TurnOnIlluminationArgs,
  TurnOnIlluminationReturn
> = {
  name: "turn_on_illumination",
  description: "",
  argsSchema: TurnOnIlluminationArgsSchema,
  returnSchema: TurnOnIlluminationReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useTurnOnIllumination = () => {
  return useTransportAction(TurnOnIlluminationDefinition);
};
