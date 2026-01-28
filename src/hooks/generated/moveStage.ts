import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

// --- Schemas ---
export const MoveStageArgsSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
  a: z.number().optional(),
  is_absolute: z.boolean().optional(),
});
export const MoveStageReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type MoveStageArgs = z.infer<typeof MoveStageArgsSchema>;
export type MoveStageReturn = z.infer<typeof MoveStageReturnSchema>;

// --- Definition ---
export const MoveStageDefinition: ActionDefinition<
  MoveStageArgs,
  MoveStageReturn
> = {
  name: "move_stage",
  description: "Move the stage to a new position.",
  argsSchema: MoveStageArgsSchema,
  returnSchema: MoveStageReturnSchema,
};

/**
 * Move the stage to a new position.
 */
export const useMoveStage = () => {
  return useAction(MoveStageDefinition);
};
