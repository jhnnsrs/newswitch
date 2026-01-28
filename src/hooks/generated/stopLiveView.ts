import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

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
  description: "Stop continuous frame acquisition.",
  argsSchema: StopLiveViewArgsSchema,
  returnSchema: StopLiveViewReturnSchema,
};

/**
 * Stop continuous frame acquisition.
 */
export const useStopLiveView = () => {
  return useAction(StopLiveViewDefinition);
};
