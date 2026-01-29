import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const GetStagePositionArgsSchema = z.object({});
export const GetStagePositionReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type GetStagePositionArgs = z.infer<typeof GetStagePositionArgsSchema>;
export type GetStagePositionReturn = z.infer<
  typeof GetStagePositionReturnSchema
>;

// --- Definition ---
export const GetStagePositionDefinition: ActionDefinition<
  GetStagePositionArgs,
  GetStagePositionReturn
> = {
  name: "get_stage_position",
  description: "",
  argsSchema: GetStagePositionArgsSchema,
  returnSchema: GetStagePositionReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useGetStagePosition = () => {
  return useTransportAction(GetStagePositionDefinition);
};
