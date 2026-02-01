import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const CaptureAndBroadcastArgsSchema = z.object({});
export const CaptureAndBroadcastReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type CaptureAndBroadcastArgs = z.infer<
  typeof CaptureAndBroadcastArgsSchema
>;
export type CaptureAndBroadcastReturn = z.infer<
  typeof CaptureAndBroadcastReturnSchema
>;

// --- Definition ---
export const CaptureAndBroadcastDefinition: ActionDefinition<
  CaptureAndBroadcastArgs,
  CaptureAndBroadcastReturn
> = {
  name: "capture_and_broadcast",
  description: "",
  argsSchema: CaptureAndBroadcastArgsSchema,
  returnSchema: CaptureAndBroadcastReturnSchema,
  lockKeys: ["camera_parameters"],
};

/**
 * undefined
 */
export const useCaptureAndBroadcast = () => {
  return useTransportAction(CaptureAndBroadcastDefinition);
};
