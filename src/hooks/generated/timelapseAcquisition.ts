import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const TimelapseAcquisitionArgsSchema = z.object({
  num_timepoints: z.number(),
  interval_seconds: z.number(),
  exposure_time: z.number().optional(),
  intensity: z.number().optional(),
});
export const TimelapseAcquisitionReturnSchema = z.array(
  z.record(z.string(), z.any()),
);

// --- Types ---
export type TimelapseAcquisitionArgs = z.infer<
  typeof TimelapseAcquisitionArgsSchema
>;
export type TimelapseAcquisitionReturn = z.infer<
  typeof TimelapseAcquisitionReturnSchema
>;

// --- Definition ---
export const TimelapseAcquisitionDefinition: ActionDefinition<
  TimelapseAcquisitionArgs,
  TimelapseAcquisitionReturn
> = {
  name: "timelapse_acquisition",
  description: "Perform a timelapse acquisition.",
  argsSchema: TimelapseAcquisitionArgsSchema,
  returnSchema: TimelapseAcquisitionReturnSchema,
};

/**
 * Perform a timelapse acquisition.
 */
export const useTimelapseAcquisition = () => {
  return useTransportAction(TimelapseAcquisitionDefinition);
};
