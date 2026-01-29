import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const MoveStageArgsSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
  a: z.number().optional(),
  is_absolute: z.boolean().optional(),
  step_size: z.number().optional(),
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
  description: "",
  argsSchema: MoveStageArgsSchema,
  returnSchema: MoveStageReturnSchema,
  lockKeys: ["stage_position"],
};

/**
 * undefined
 */
export const useMoveStage = () => {
  return useTransportAction(MoveStageDefinition);
};
