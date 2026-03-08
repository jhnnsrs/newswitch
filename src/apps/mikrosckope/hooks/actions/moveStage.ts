import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeMoveStageArgsSchema = z.object({
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
export const MikrosckopeMoveStageReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeMoveStageArgs = z.infer<
  typeof MikrosckopeMoveStageArgsSchema
>;
export type MikrosckopeMoveStageReturn = z.infer<
  typeof MikrosckopeMoveStageReturnSchema
>;

export const MoveStageArgsSchema = MikrosckopeMoveStageArgsSchema;
export const MoveStageReturnSchema = MikrosckopeMoveStageReturnSchema;
export type MoveStageArgs = MikrosckopeMoveStageArgs;
export type MoveStageReturn = MikrosckopeMoveStageReturn;

// --- Definition ---
export const MikrosckopeMoveStageDefinition: ActionDefinition<
  MikrosckopeMoveStageArgs,
  MikrosckopeMoveStageReturn
> = {
  name: 'move_stage',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeMoveStageArgsSchema,
  returnSchema: MikrosckopeMoveStageReturnSchema,
  lockKeys: ['stage_position'],
};

export const MoveStageDefinition = MikrosckopeMoveStageDefinition;

/**
 * undefined
 */
export const useMikrosckopeMoveStage = () => {
  return useTransportAction(MikrosckopeMoveStageDefinition);
};

export const useMoveStage = useMikrosckopeMoveStage;

/** Optimistic state hooks for move_stage */

export const MikrosckopeOptimisticStageState = {
  key: 'StageState',
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

export const OptimisticStageState = MikrosckopeOptimisticStageState;
