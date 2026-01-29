import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const StartLiveViewArgsSchema = z.object({});
export const StartLiveViewReturnSchema = z.string();

// --- Types ---
export type StartLiveViewArgs = z.infer<typeof StartLiveViewArgsSchema>;
export type StartLiveViewReturn = z.infer<typeof StartLiveViewReturnSchema>;

// --- Definition ---
export const StartLiveViewDefinition: ActionDefinition<
  StartLiveViewArgs,
  StartLiveViewReturn
> = {
  name: "start_live_view",
  description: "Start continuous frame acquisition for live view.",
  argsSchema: StartLiveViewArgsSchema,
  returnSchema: StartLiveViewReturnSchema,
};

/**
 * Start continuous frame acquisition for live view.
 */
export const useStartLiveView = () => {
  return useTransportAction(StartLiveViewDefinition);
};
