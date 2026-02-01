import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const ZStackAcquisitionArgsSchema = z.object({
  z_start: z.number(),
  z_end: z.number(),
  z_step: z.number(),
  slot: z.number().optional(),
  exposure_time: z.number().optional(),
  intensity: z.number().optional(),
});
export const ZStackAcquisitionReturnSchema = z.array(
  z.record(z.string(), z.any()),
);

// --- Types ---
export type ZStackAcquisitionArgs = z.infer<typeof ZStackAcquisitionArgsSchema>;
export type ZStackAcquisitionReturn = z.infer<
  typeof ZStackAcquisitionReturnSchema
>;

// --- Definition ---
export const ZStackAcquisitionDefinition: ActionDefinition<
  ZStackAcquisitionArgs,
  ZStackAcquisitionReturn
> = {
  name: "z_stack_acquisition",
  description: "",
  argsSchema: ZStackAcquisitionArgsSchema,
  returnSchema: ZStackAcquisitionReturnSchema,
  lockKeys: ["stage_position"],
};

/**
 * undefined
 */
export const useZStackAcquisition = () => {
  return useTransportAction(ZStackAcquisitionDefinition);
};
