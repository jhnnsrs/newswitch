import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const MoveHomeArgsSchema = z.object({});
export const MoveHomeReturnSchema = z.void();

// --- Types ---
export type MoveHomeArgs = z.infer<typeof MoveHomeArgsSchema>;
export type MoveHomeReturn = z.infer<typeof MoveHomeReturnSchema>;

// --- Definition ---
export const MoveHomeDefinition: ActionDefinition<
  MoveHomeArgs,
  MoveHomeReturn
> = {
  name: "move_home",
  description: "",
  argsSchema: MoveHomeArgsSchema,
  returnSchema: MoveHomeReturnSchema,
  lockKeys: ["stage_position"],
};

/**
 * undefined
 */
export const useMoveHome = () => {
  return useTransportAction(MoveHomeDefinition);
};
