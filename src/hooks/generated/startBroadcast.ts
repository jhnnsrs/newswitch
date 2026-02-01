import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const StartBroadcastArgsSchema = z.object({});
export const StartBroadcastReturnSchema = z.string();

// --- Types ---
export type StartBroadcastArgs = z.infer<typeof StartBroadcastArgsSchema>;
export type StartBroadcastReturn = z.infer<typeof StartBroadcastReturnSchema>;

// --- Definition ---
export const StartBroadcastDefinition: ActionDefinition<
  StartBroadcastArgs,
  StartBroadcastReturn
> = {
  name: "start_broadcast",
  description: "",
  argsSchema: StartBroadcastArgsSchema,
  returnSchema: StartBroadcastReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useStartBroadcast = () => {
  return useTransportAction(StartBroadcastDefinition);
};
