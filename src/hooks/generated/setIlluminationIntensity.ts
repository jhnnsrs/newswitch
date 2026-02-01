import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const SetIlluminationIntensityArgsSchema = z.object({
  intensity: z.number(),
  channel: z.number().optional(),
});
export const SetIlluminationIntensityReturnSchema = z.number();

// --- Types ---
export type SetIlluminationIntensityArgs = z.infer<
  typeof SetIlluminationIntensityArgsSchema
>;
export type SetIlluminationIntensityReturn = z.infer<
  typeof SetIlluminationIntensityReturnSchema
>;

// --- Definition ---
export const SetIlluminationIntensityDefinition: ActionDefinition<
  SetIlluminationIntensityArgs,
  SetIlluminationIntensityReturn
> = {
  name: "set_illumination_intensity",
  description: "",
  argsSchema: SetIlluminationIntensityArgsSchema,
  returnSchema: SetIlluminationIntensityReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useSetIlluminationIntensity = () => {
  return useTransportAction(SetIlluminationIntensityDefinition);
};
