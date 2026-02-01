import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const AcquireLiveArgsSchema = z.object({});
export const AcquireLiveReturnSchema = z.void();

// --- Types ---
export type AcquireLiveArgs = z.infer<typeof AcquireLiveArgsSchema>;
export type AcquireLiveReturn = z.infer<typeof AcquireLiveReturnSchema>;

// --- Definition ---
export const AcquireLiveDefinition: ActionDefinition<
  AcquireLiveArgs,
  AcquireLiveReturn
> = {
  name: "acquire_live",
  description: "",
  argsSchema: AcquireLiveArgsSchema,
  returnSchema: AcquireLiveReturnSchema,
  lockKeys: ["camera_parameters"],
};

/**
 * undefined
 */
export const useAcquireLive = () => {
  return useTransportAction(AcquireLiveDefinition);
};
