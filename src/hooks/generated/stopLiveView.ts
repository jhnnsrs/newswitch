import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const StopLiveViewArgsSchema = z.object({});
export const StopLiveViewReturnSchema = z.string();

// --- Types ---
export type StopLiveViewArgs = z.infer<typeof StopLiveViewArgsSchema>;
export type StopLiveViewReturn = z.infer<typeof StopLiveViewReturnSchema>;

// --- Definition ---
export const StopLiveViewDefinition: ActionDefinition<
  StopLiveViewArgs,
  StopLiveViewReturn
> = {
  name: "stop_live_view",
  description: "",
  argsSchema: StopLiveViewArgsSchema,
  returnSchema: StopLiveViewReturnSchema,
  lockKeys: ["camera_parameters"],
};

/**
 * undefined
 */
export const useStopLiveView = () => {
  return useTransportAction(StopLiveViewDefinition);
};
