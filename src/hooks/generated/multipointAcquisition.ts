import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const MultipointAcquisitionArgsSchema = z.object({
  positions: z.array(z.any()),
  slot: z.number().optional(),
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
  description: "",
  argsSchema: MultipointAcquisitionArgsSchema,
  returnSchema: MultipointAcquisitionReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useMultipointAcquisition = () => {
  return useTransportAction(MultipointAcquisitionDefinition);
};
