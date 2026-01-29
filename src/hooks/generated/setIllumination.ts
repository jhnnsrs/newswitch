import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const SetIlluminationArgsSchema = z.object({
  intensity: z.number(),
  wavelength: z.number(),
  channel: z.number().optional(),
});
export const SetIlluminationReturnSchema = z.string();

// --- Types ---
export type SetIlluminationArgs = z.infer<typeof SetIlluminationArgsSchema>;
export type SetIlluminationReturn = z.infer<typeof SetIlluminationReturnSchema>;

// --- Definition ---
export const SetIlluminationDefinition: ActionDefinition<
  SetIlluminationArgs,
  SetIlluminationReturn
> = {
  name: "set_illumination",
  description: "Set illumination parameters.",
  argsSchema: SetIlluminationArgsSchema,
  returnSchema: SetIlluminationReturnSchema,
};

/**
 * Set illumination parameters.
 */
export const useSetIllumination = () => {
  return useTransportAction(SetIlluminationDefinition);
};
