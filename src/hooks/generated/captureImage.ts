import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const CaptureImageArgsSchema = z.object({});
export const CaptureImageReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type CaptureImageArgs = z.infer<typeof CaptureImageArgsSchema>;
export type CaptureImageReturn = z.infer<typeof CaptureImageReturnSchema>;

// --- Definition ---
export const CaptureImageDefinition: ActionDefinition<
  CaptureImageArgs,
  CaptureImageReturn
> = {
  name: "capture_image",
  description: "",
  argsSchema: CaptureImageArgsSchema,
  returnSchema: CaptureImageReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useCaptureImage = () => {
  return useTransportAction(CaptureImageDefinition);
};
