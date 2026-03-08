import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeNeverEndingFunctionArgsSchema = z.object({});
export const MikrosckopeNeverEndingFunctionReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeNeverEndingFunctionArgs = z.infer<
  typeof MikrosckopeNeverEndingFunctionArgsSchema
>;
export type MikrosckopeNeverEndingFunctionReturn = z.infer<
  typeof MikrosckopeNeverEndingFunctionReturnSchema
>;

export const NeverEndingFunctionArgsSchema =
  MikrosckopeNeverEndingFunctionArgsSchema;
export const NeverEndingFunctionReturnSchema =
  MikrosckopeNeverEndingFunctionReturnSchema;
export type NeverEndingFunctionArgs = MikrosckopeNeverEndingFunctionArgs;
export type NeverEndingFunctionReturn = MikrosckopeNeverEndingFunctionReturn;

// --- Definition ---
export const MikrosckopeNeverEndingFunctionDefinition: ActionDefinition<
  MikrosckopeNeverEndingFunctionArgs,
  MikrosckopeNeverEndingFunctionReturn
> = {
  name: 'never_ending_function',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeNeverEndingFunctionArgsSchema,
  returnSchema: MikrosckopeNeverEndingFunctionReturnSchema,
  lockKeys: [],
};

export const NeverEndingFunctionDefinition =
  MikrosckopeNeverEndingFunctionDefinition;

/**
 * undefined
 */
export const useMikrosckopeNeverEndingFunction = () => {
  return useAction(MikrosckopeNeverEndingFunctionDefinition);
};

export const useNeverEndingFunction = useMikrosckopeNeverEndingFunction;
