import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const UpdateDetectorArgsSchema = z.object({
  slot: z.number(),
  exposure_time: z.number().optional(),
  gain: z.number().optional(),
});
export const UpdateDetectorReturnSchema = z.any();

// --- Types ---
export type UpdateDetectorArgs = z.infer<typeof UpdateDetectorArgsSchema>;
export type UpdateDetectorReturn = z.infer<typeof UpdateDetectorReturnSchema>;

// --- Definition ---
export const UpdateDetectorDefinition: ActionDefinition<
  UpdateDetectorArgs,
  UpdateDetectorReturn
> = {
  name: "update_detector",
  description: "",
  argsSchema: UpdateDetectorArgsSchema,
  returnSchema: UpdateDetectorReturnSchema,
  lockKeys: ["camera_parameters"],
};

/**
 * undefined
 */
export const useUpdateDetector = () => {
  return useTransportAction(UpdateDetectorDefinition);
};
