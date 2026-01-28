import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

// --- Schemas ---
export const ZStackAcquisitionArgsSchema = z.object({
  z_start: z.number(),
  z_end: z.number(),
  z_step: z.number(),
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
  description: "Perform a Z-stack acquisition.",
  argsSchema: ZStackAcquisitionArgsSchema,
  returnSchema: ZStackAcquisitionReturnSchema,
};

/**
 * Perform a Z-stack acquisition.
 */
export const useZStackAcquisition = () => {
  return useAction(ZStackAcquisitionDefinition);
};
