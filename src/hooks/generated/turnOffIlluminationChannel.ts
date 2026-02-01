import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const TurnOffIlluminationChannelArgsSchema = z.object({
  channel: z.number(),
});
export const TurnOffIlluminationChannelReturnSchema = z.string();

// --- Types ---
export type TurnOffIlluminationChannelArgs = z.infer<
  typeof TurnOffIlluminationChannelArgsSchema
>;
export type TurnOffIlluminationChannelReturn = z.infer<
  typeof TurnOffIlluminationChannelReturnSchema
>;

// --- Definition ---
export const TurnOffIlluminationChannelDefinition: ActionDefinition<
  TurnOffIlluminationChannelArgs,
  TurnOffIlluminationChannelReturn
> = {
  name: "turn_off_illumination_channel",
  description: "",
  argsSchema: TurnOffIlluminationChannelArgsSchema,
  returnSchema: TurnOffIlluminationChannelReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useTurnOffIlluminationChannel = () => {
  return useTransportAction(TurnOffIlluminationChannelDefinition);
};
