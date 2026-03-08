import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const LongStuffRunningArgsSchema = z.object({});
export const LongStuffRunningReturnSchema = z.object({});

// --- Types ---
export type LongStuffRunningArgs = z.infer<typeof LongStuffRunningArgsSchema>;
export type LongStuffRunningReturn = z.infer<
  typeof LongStuffRunningReturnSchema
>;

// --- Definition ---
export const LongStuffRunningDefinition: ActionDefinition<
  LongStuffRunningArgs,
  LongStuffRunningReturn
> = {
  name: 'long_stuff_running',
  appKey: 'default',
  description: '',
  argsSchema: LongStuffRunningArgsSchema,
  returnSchema: LongStuffRunningReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useLongStuffRunning = () => {
  return useAction(LongStuffRunningDefinition);
};
