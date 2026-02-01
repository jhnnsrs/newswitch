import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const StopBroadcastArgsSchema = z.object({});
export const StopBroadcastReturnSchema = z.string();

// --- Types ---
export type StopBroadcastArgs = z.infer<typeof StopBroadcastArgsSchema>;
export type StopBroadcastReturn = z.infer<typeof StopBroadcastReturnSchema>;

// --- Definition ---
export const StopBroadcastDefinition: ActionDefinition<
  StopBroadcastArgs,
  StopBroadcastReturn
> = {
  name: "stop_broadcast",
  description: "",
  argsSchema: StopBroadcastArgsSchema,
  returnSchema: StopBroadcastReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useStopBroadcast = () => {
  return useTransportAction(StopBroadcastDefinition);
};
