import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const ActivateDetectorArgsSchema = z.object({
  slot: z.number(),
});
export const ActivateDetectorReturnSchema = z.any();

// --- Types ---
export type ActivateDetectorArgs = z.infer<typeof ActivateDetectorArgsSchema>;
export type ActivateDetectorReturn = z.infer<
  typeof ActivateDetectorReturnSchema
>;

// --- Definition ---
export const ActivateDetectorDefinition: ActionDefinition<
  ActivateDetectorArgs,
  ActivateDetectorReturn
> = {
  name: "activate_detector",
  description: "",
  argsSchema: ActivateDetectorArgsSchema,
  returnSchema: ActivateDetectorReturnSchema,
  lockKeys: ["camera_parameters"],
};

/**
 * undefined
 */
export const useActivateDetector = () => {
  return useTransportAction(ActivateDetectorDefinition);
};
