import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const ClearExpanseArgsSchema = z.object({});
export const ClearExpanseReturnSchema = z.object({});

// --- Types ---
export type ClearExpanseArgs = z.infer<typeof ClearExpanseArgsSchema>;
export type ClearExpanseReturn = z.infer<typeof ClearExpanseReturnSchema>;

// --- Definition ---
export const ClearExpanseDefinition: ActionDefinition<
  ClearExpanseArgs,
  ClearExpanseReturn
> = {
  name: 'clear_expanse',
  description: '',
  argsSchema: ClearExpanseArgsSchema,
  returnSchema: ClearExpanseReturnSchema,
  lockKeys: ['expanse_state'],
};

/**
 * undefined
 */
export const useClearExpanse = () => {
  return useTransportAction(ClearExpanseDefinition);
};
