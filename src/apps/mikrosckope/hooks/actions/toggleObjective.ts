import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeToggleObjectiveArgsSchema = z.object({});
export const MikrosckopeToggleObjectiveReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeToggleObjectiveArgs = z.infer<
  typeof MikrosckopeToggleObjectiveArgsSchema
>;
export type MikrosckopeToggleObjectiveReturn = z.infer<
  typeof MikrosckopeToggleObjectiveReturnSchema
>;

export const ToggleObjectiveArgsSchema = MikrosckopeToggleObjectiveArgsSchema;
export const ToggleObjectiveReturnSchema =
  MikrosckopeToggleObjectiveReturnSchema;
export type ToggleObjectiveArgs = MikrosckopeToggleObjectiveArgs;
export type ToggleObjectiveReturn = MikrosckopeToggleObjectiveReturn;

// --- Definition ---
export const MikrosckopeToggleObjectiveDefinition: ActionDefinition<
  MikrosckopeToggleObjectiveArgs,
  MikrosckopeToggleObjectiveReturn
> = {
  name: 'toggle_objective',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeToggleObjectiveArgsSchema,
  returnSchema: MikrosckopeToggleObjectiveReturnSchema,
  lockKeys: ['objective'],
};

export const ToggleObjectiveDefinition = MikrosckopeToggleObjectiveDefinition;

/**
 * undefined
 */
export const useMikrosckopeToggleObjective = () => {
  return useAction(MikrosckopeToggleObjectiveDefinition);
};

export const useToggleObjective = useMikrosckopeToggleObjective;
