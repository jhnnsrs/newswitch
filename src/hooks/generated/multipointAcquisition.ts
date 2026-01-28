import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

// --- Schemas ---
export const MultipointAcquisitionArgsSchema = z.object({
  positions: z.array(z.record(z.string(), z.any())),
  exposure_time: z.number().optional(),
  intensity: z.number().optional(),
});
export const MultipointAcquisitionReturnSchema = z.array(
  z.record(z.string(), z.any()),
);

// --- Types ---
export type MultipointAcquisitionArgs = z.infer<
  typeof MultipointAcquisitionArgsSchema
>;
export type MultipointAcquisitionReturn = z.infer<
  typeof MultipointAcquisitionReturnSchema
>;

// --- Definition ---
export const MultipointAcquisitionDefinition: ActionDefinition<
  MultipointAcquisitionArgs,
  MultipointAcquisitionReturn
> = {
  name: "multipoint_acquisition",
  description: "Acquire images at multiple stage positions.",
  argsSchema: MultipointAcquisitionArgsSchema,
  returnSchema: MultipointAcquisitionReturnSchema,
};

/**
 * Acquire images at multiple stage positions.
 */
export const useMultipointAcquisition = () => {
  return useAction(MultipointAcquisitionDefinition);
};
