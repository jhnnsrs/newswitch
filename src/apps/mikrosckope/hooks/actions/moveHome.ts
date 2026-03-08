import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeMoveHomeArgsSchema = z.object({});
export const MikrosckopeMoveHomeReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeMoveHomeArgs = z.infer<
  typeof MikrosckopeMoveHomeArgsSchema
>;
export type MikrosckopeMoveHomeReturn = z.infer<
  typeof MikrosckopeMoveHomeReturnSchema
>;

export const MoveHomeArgsSchema = MikrosckopeMoveHomeArgsSchema;
export const MoveHomeReturnSchema = MikrosckopeMoveHomeReturnSchema;
export type MoveHomeArgs = MikrosckopeMoveHomeArgs;
export type MoveHomeReturn = MikrosckopeMoveHomeReturn;

// --- Definition ---
export const MikrosckopeMoveHomeDefinition: ActionDefinition<
  MikrosckopeMoveHomeArgs,
  MikrosckopeMoveHomeReturn
> = {
  name: 'move_home',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeMoveHomeArgsSchema,
  returnSchema: MikrosckopeMoveHomeReturnSchema,
  lockKeys: ['stage_position'],
};

export const MoveHomeDefinition = MikrosckopeMoveHomeDefinition;

/**
 * undefined
 */
export const useMikrosckopeMoveHome = () => {
  return useAction(MikrosckopeMoveHomeDefinition);
};

export const useMoveHome = useMikrosckopeMoveHome;
