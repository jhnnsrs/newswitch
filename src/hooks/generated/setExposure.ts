import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const SetExposureArgsSchema = z.object({
  exposure_time: z.number(),
});
export const SetExposureReturnSchema = z.number();

// --- Types ---
export type SetExposureArgs = z.infer<typeof SetExposureArgsSchema>;
export type SetExposureReturn = z.infer<typeof SetExposureReturnSchema>;

// --- Definition ---
export const SetExposureDefinition: ActionDefinition<
  SetExposureArgs,
  SetExposureReturn
> = {
  name: "set_exposure",
  description: "",
  argsSchema: SetExposureArgsSchema,
  returnSchema: SetExposureReturnSchema,
  lockKeys: ["camera_parameters"],
};

/**
 * undefined
 */
export const useSetExposure = () => {
  return useTransportAction(SetExposureDefinition);
};
