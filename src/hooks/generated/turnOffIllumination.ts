import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const TurnOffIlluminationArgsSchema = z.object({});
export const TurnOffIlluminationReturnSchema = z.string();

// --- Types ---
export type TurnOffIlluminationArgs = z.infer<
  typeof TurnOffIlluminationArgsSchema
>;
export type TurnOffIlluminationReturn = z.infer<
  typeof TurnOffIlluminationReturnSchema
>;

// --- Definition ---
export const TurnOffIlluminationDefinition: ActionDefinition<
  TurnOffIlluminationArgs,
  TurnOffIlluminationReturn
> = {
  name: "turn_off_illumination",
  description: "",
  argsSchema: TurnOffIlluminationArgsSchema,
  returnSchema: TurnOffIlluminationReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useTurnOffIllumination = () => {
  return useTransportAction(TurnOffIlluminationDefinition);
};
