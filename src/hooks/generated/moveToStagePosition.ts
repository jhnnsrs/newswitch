import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const MoveToStagePositionArgsSchema = z.object({
  position_x: z.number(),
  position_y: z.number(),
  position_z: z.number(),
});
export const MoveToStagePositionReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type MoveToStagePositionArgs = z.infer<
  typeof MoveToStagePositionArgsSchema
>;
export type MoveToStagePositionReturn = z.infer<
  typeof MoveToStagePositionReturnSchema
>;

// --- Definition ---
export const MoveToStagePositionDefinition: ActionDefinition<
  MoveToStagePositionArgs,
  MoveToStagePositionReturn
> = {
  name: "move_to_stage_position",
  description: "Move the stage to a specified position.",
  argsSchema: MoveToStagePositionArgsSchema,
  returnSchema: MoveToStagePositionReturnSchema,
};

/**
 * Move the stage to a specified position.
 */
export const useMoveToStagePosition = () => {
  return useTransportAction(MoveToStagePositionDefinition);
};
