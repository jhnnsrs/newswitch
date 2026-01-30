import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const EstimateExposureArgsSchema = z.object({
  target_brightness: z.number(),
});
export const EstimateExposureReturnSchema = z.number();

// --- Types ---
export type EstimateExposureArgs = z.infer<typeof EstimateExposureArgsSchema>;
export type EstimateExposureReturn = z.infer<
  typeof EstimateExposureReturnSchema
>;

// --- Definition ---
export const EstimateExposureDefinition: ActionDefinition<
  EstimateExposureArgs,
  EstimateExposureReturn
> = {
  name: "estimate_exposure",
  description: "",
  argsSchema: EstimateExposureArgsSchema,
  returnSchema: EstimateExposureReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useEstimateExposure = () => {
  return useTransportAction(EstimateExposureDefinition);
};
