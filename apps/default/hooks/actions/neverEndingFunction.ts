import { z } from 'zod';
import { useAction, type ActionDefinition } from '@/lib/rekuest/task';

// --- Shared Models ---

// --- Schemas ---
export const NeverEndingFunctionArgsSchema = z.object({});
export const NeverEndingFunctionReturnSchema = z.object({});

// --- Types ---
export type NeverEndingFunctionArgs = z.infer<
  typeof NeverEndingFunctionArgsSchema
>;
export type NeverEndingFunctionReturn = z.infer<
  typeof NeverEndingFunctionReturnSchema
>;

// --- Definition ---
export const NeverEndingFunctionDefinition: ActionDefinition<
  NeverEndingFunctionArgs,
  NeverEndingFunctionReturn
> = {
  name: 'never_ending_function',
  appKey: 'default',
  description: '',
  argsSchema: NeverEndingFunctionArgsSchema,
  returnSchema: NeverEndingFunctionReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useNeverEndingFunction = () => {
  return useAction(NeverEndingFunctionDefinition);
};
