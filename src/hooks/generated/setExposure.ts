import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

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
  description: "Set detector exposure time.",
  argsSchema: SetExposureArgsSchema,
  returnSchema: SetExposureReturnSchema,
};

/**
 * Set detector exposure time.
 */
export const useSetExposure = () => {
  return useAction(SetExposureDefinition);
};
