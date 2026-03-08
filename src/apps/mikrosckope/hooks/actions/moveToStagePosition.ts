import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeMoveToStagePositionArgsSchema = z.object({
  position_x: z.number(),
  position_y: z.number(),
  position_z: z.number(),
});
export const MikrosckopeMoveToStagePositionReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeMoveToStagePositionArgs = z.infer<
  typeof MikrosckopeMoveToStagePositionArgsSchema
>;
export type MikrosckopeMoveToStagePositionReturn = z.infer<
  typeof MikrosckopeMoveToStagePositionReturnSchema
>;

export const MoveToStagePositionArgsSchema =
  MikrosckopeMoveToStagePositionArgsSchema;
export const MoveToStagePositionReturnSchema =
  MikrosckopeMoveToStagePositionReturnSchema;
export type MoveToStagePositionArgs = MikrosckopeMoveToStagePositionArgs;
export type MoveToStagePositionReturn = MikrosckopeMoveToStagePositionReturn;

// --- Definition ---
export const MikrosckopeMoveToStagePositionDefinition: ActionDefinition<
  MikrosckopeMoveToStagePositionArgs,
  MikrosckopeMoveToStagePositionReturn
> = {
  name: 'move_to_stage_position',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeMoveToStagePositionArgsSchema,
  returnSchema: MikrosckopeMoveToStagePositionReturnSchema,
  lockKeys: ['stage_position'],
};

export const MoveToStagePositionDefinition =
  MikrosckopeMoveToStagePositionDefinition;

/**
 * undefined
 */
export const useMikrosckopeMoveToStagePosition = () => {
  return useTransportAction(MikrosckopeMoveToStagePositionDefinition);
};

export const useMoveToStagePosition = useMikrosckopeMoveToStagePosition;
