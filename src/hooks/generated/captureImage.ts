import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

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
  description: "Capture a single image from the detector.",
  argsSchema: CaptureImageArgsSchema,
  returnSchema: CaptureImageReturnSchema,
};

/**
 * Capture a single image from the detector.
 */
export const useCaptureImage = () => {
  return useAction(CaptureImageDefinition);
};
