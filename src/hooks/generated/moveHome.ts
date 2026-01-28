import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

// --- Schemas ---
export const MoveHomeArgsSchema = z.object({});
export const MoveHomeReturnSchema = z.record(z.string(), z.any());

// --- Types ---
export type MoveHomeArgs = z.infer<typeof MoveHomeArgsSchema>;
export type MoveHomeReturn = z.infer<typeof MoveHomeReturnSchema>;

// --- Definition ---
export const MoveHomeDefinition: ActionDefinition<
  MoveHomeArgs,
  MoveHomeReturn
> = {
  name: "move_home",
  description: "Move stage to home position.",
  argsSchema: MoveHomeArgsSchema,
  returnSchema: MoveHomeReturnSchema,
};

/**
 * Move stage to home position.
 */
export const useMoveHome = () => {
  return useAction(MoveHomeDefinition);
};
