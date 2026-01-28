import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

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
  description: "Get current stage position.",
  argsSchema: GetStagePositionArgsSchema,
  returnSchema: GetStagePositionReturnSchema,
};

/**
 * Get current stage position.
 */
export const useGetStagePosition = () => {
  return useAction(GetStagePositionDefinition);
};
