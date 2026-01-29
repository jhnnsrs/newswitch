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
  description: "",
  argsSchema: StartLiveViewArgsSchema,
  returnSchema: StartLiveViewReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useStartLiveView = () => {
  return useTransportAction(StartLiveViewDefinition);
};
