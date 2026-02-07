import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const SwitchObjectiveArgsSchema = z.object({
  /** Objective slot number */
  slot: z.number().describe('Objective slot number'),
});
export const SwitchObjectiveReturnSchema = z.void();

// --- Types ---
export type SwitchObjectiveArgs = z.infer<typeof SwitchObjectiveArgsSchema>;
export type SwitchObjectiveReturn = z.infer<typeof SwitchObjectiveReturnSchema>;

// --- Definition ---
export const SwitchObjectiveDefinition: ActionDefinition<
  SwitchObjectiveArgs,
  SwitchObjectiveReturn
> = {
  name: 'switch_objective',
  description: '',
  argsSchema: SwitchObjectiveArgsSchema,
  returnSchema: SwitchObjectiveReturnSchema,
  lockKeys: ['objective'],
};

/**
 * undefined
 */
export const useSwitchObjective = () => {
  return useTransportAction(SwitchObjectiveDefinition);
};
