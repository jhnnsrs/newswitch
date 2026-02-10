import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MoveStageArgsSchema = z.object({
  /** X position (micrometers) */
  x: z.number().describe('X position (micrometers)').optional(),
  /** Y position (micrometers) */
  y: z.number().describe('Y position (micrometers)').optional(),
  /** Z position (micrometers) */
  z: z.number().describe('Z position (micrometers)').optional(),
  /** A (rotation) position */
  a: z.number().describe('A (rotation) position').optional(),
  /** If True, move to absolute position; if False, relative move */
  is_absolute: z
    .boolean()
    .describe('If True, move to absolute position; if False, relative move')
    .optional(),
  /** Step size in micrometers for movement simulation (default: 1.0) */
  step_size: z
    .number()
    .describe('Step size in micrometers for movement simulation (default: 1.0)')
    .optional(),
});
export const MoveStageReturnSchema = z.void();

// --- Types ---
export type MoveStageArgs = z.infer<typeof MoveStageArgsSchema>;
export type MoveStageReturn = z.infer<typeof MoveStageReturnSchema>;

// --- Definition ---
export const MoveStageDefinition: ActionDefinition<
  MoveStageArgs,
  MoveStageReturn
> = {
  name: 'move_stage',
  description: '',
  argsSchema: MoveStageArgsSchema,
  returnSchema: MoveStageReturnSchema,
  lockKeys: ['stage_position'],
};

/**
 * undefined
 */
export const useMoveStage = () => {
  return useTransportAction(MoveStageDefinition);
};

/** Optimistic state hooks for move_stage */

export const OptimisticStageState = {
  selector: (state: never) => state,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessor: (state: any, args: any) => ({
    ...state,
    x: args.x,
    y: args.y,
    z: args.z,
    a: args.a,
  }),
};
