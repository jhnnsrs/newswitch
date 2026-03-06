import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

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
  description: '',
  argsSchema: NeverEndingFunctionArgsSchema,
  returnSchema: NeverEndingFunctionReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useNeverEndingFunction = () => {
  return useTransportAction(NeverEndingFunctionDefinition);
};
