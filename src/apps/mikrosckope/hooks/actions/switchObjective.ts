import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeSwitchObjectiveArgsSchema = z.object({
  /** Objective slot number */
  slot: z.number().describe('Objective slot number'),
});
export const MikrosckopeSwitchObjectiveReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeSwitchObjectiveArgs = z.infer<
  typeof MikrosckopeSwitchObjectiveArgsSchema
>;
export type MikrosckopeSwitchObjectiveReturn = z.infer<
  typeof MikrosckopeSwitchObjectiveReturnSchema
>;

export const SwitchObjectiveArgsSchema = MikrosckopeSwitchObjectiveArgsSchema;
export const SwitchObjectiveReturnSchema =
  MikrosckopeSwitchObjectiveReturnSchema;
export type SwitchObjectiveArgs = MikrosckopeSwitchObjectiveArgs;
export type SwitchObjectiveReturn = MikrosckopeSwitchObjectiveReturn;

// --- Definition ---
export const MikrosckopeSwitchObjectiveDefinition: ActionDefinition<
  MikrosckopeSwitchObjectiveArgs,
  MikrosckopeSwitchObjectiveReturn
> = {
  name: 'switch_objective',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeSwitchObjectiveArgsSchema,
  returnSchema: MikrosckopeSwitchObjectiveReturnSchema,
  lockKeys: ['objective'],
};

export const SwitchObjectiveDefinition = MikrosckopeSwitchObjectiveDefinition;

/**
 * undefined
 */
export const useMikrosckopeSwitchObjective = () => {
  return useAction(MikrosckopeSwitchObjectiveDefinition);
};

export const useSwitchObjective = useMikrosckopeSwitchObjective;
