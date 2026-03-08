import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const DumpStatesToStdinArgsSchema = z.object({});
export const DumpStatesToStdinReturnSchema = z.object({});

// --- Types ---
export type DumpStatesToStdinArgs = z.infer<typeof DumpStatesToStdinArgsSchema>;
export type DumpStatesToStdinReturn = z.infer<
  typeof DumpStatesToStdinReturnSchema
>;

// --- Definition ---
export const DumpStatesToStdinDefinition: ActionDefinition<
  DumpStatesToStdinArgs,
  DumpStatesToStdinReturn
> = {
  name: 'dump_states_to_stdin',
  appKey: 'default',
  description: '',
  argsSchema: DumpStatesToStdinArgsSchema,
  returnSchema: DumpStatesToStdinReturnSchema,
  lockKeys: [
    'camera_parameters',
    'expanse_state',
    'filter_bank',
    'illumination',
    'objective',
    'stage_position',
  ],
};

/**
 * undefined
 */
export const useDumpStatesToStdin = () => {
  return useAction(DumpStatesToStdinDefinition);
};
