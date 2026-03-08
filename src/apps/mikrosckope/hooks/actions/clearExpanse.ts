import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeClearExpanseArgsSchema = z.object({});
export const MikrosckopeClearExpanseReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeClearExpanseArgs = z.infer<
  typeof MikrosckopeClearExpanseArgsSchema
>;
export type MikrosckopeClearExpanseReturn = z.infer<
  typeof MikrosckopeClearExpanseReturnSchema
>;

export const ClearExpanseArgsSchema = MikrosckopeClearExpanseArgsSchema;
export const ClearExpanseReturnSchema = MikrosckopeClearExpanseReturnSchema;
export type ClearExpanseArgs = MikrosckopeClearExpanseArgs;
export type ClearExpanseReturn = MikrosckopeClearExpanseReturn;

// --- Definition ---
export const MikrosckopeClearExpanseDefinition: ActionDefinition<
  MikrosckopeClearExpanseArgs,
  MikrosckopeClearExpanseReturn
> = {
  name: 'clear_expanse',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeClearExpanseArgsSchema,
  returnSchema: MikrosckopeClearExpanseReturnSchema,
  lockKeys: ['expanse_state'],
};

export const ClearExpanseDefinition = MikrosckopeClearExpanseDefinition;

/**
 * undefined
 */
export const useMikrosckopeClearExpanse = () => {
  return useTransportAction(MikrosckopeClearExpanseDefinition);
};

export const useClearExpanse = useMikrosckopeClearExpanse;
