import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeDumpStatesToStdinArgsSchema = z.object({});
export const MikrosckopeDumpStatesToStdinReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeDumpStatesToStdinArgs = z.infer<
  typeof MikrosckopeDumpStatesToStdinArgsSchema
>;
export type MikrosckopeDumpStatesToStdinReturn = z.infer<
  typeof MikrosckopeDumpStatesToStdinReturnSchema
>;

export const DumpStatesToStdinArgsSchema =
  MikrosckopeDumpStatesToStdinArgsSchema;
export const DumpStatesToStdinReturnSchema =
  MikrosckopeDumpStatesToStdinReturnSchema;
export type DumpStatesToStdinArgs = MikrosckopeDumpStatesToStdinArgs;
export type DumpStatesToStdinReturn = MikrosckopeDumpStatesToStdinReturn;

// --- Definition ---
export const MikrosckopeDumpStatesToStdinDefinition: ActionDefinition<
  MikrosckopeDumpStatesToStdinArgs,
  MikrosckopeDumpStatesToStdinReturn
> = {
  name: 'dump_states_to_stdin',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeDumpStatesToStdinArgsSchema,
  returnSchema: MikrosckopeDumpStatesToStdinReturnSchema,
  lockKeys: [
    'camera_parameters',
    'expanse_state',
    'filter_bank',
    'illumination',
    'objective',
    'stage_position',
  ],
};

export const DumpStatesToStdinDefinition =
  MikrosckopeDumpStatesToStdinDefinition;

/**
 * undefined
 */
export const useMikrosckopeDumpStatesToStdin = () => {
  return useAction(MikrosckopeDumpStatesToStdinDefinition);
};

export const useDumpStatesToStdin = useMikrosckopeDumpStatesToStdin;
