import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const GetMicroscopeStatusArgsSchema = z.object({});
export const GetMicroscopeStatusReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type GetMicroscopeStatusArgs = z.infer<
  typeof GetMicroscopeStatusArgsSchema
>;
export type GetMicroscopeStatusReturn = z.infer<
  typeof GetMicroscopeStatusReturnSchema
>;

// --- Definition ---
export const GetMicroscopeStatusDefinition: ActionDefinition<
  GetMicroscopeStatusArgs,
  GetMicroscopeStatusReturn
> = {
  name: "get_microscope_status",
  description: "Get the complete status of the virtual microscope.",
  argsSchema: GetMicroscopeStatusArgsSchema,
  returnSchema: GetMicroscopeStatusReturnSchema,
};

/**
 * Get the complete status of the virtual microscope.
 */
export const useGetMicroscopeStatus = () => {
  return useTransportAction(GetMicroscopeStatusDefinition);
};
