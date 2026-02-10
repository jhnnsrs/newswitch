import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const LongStuffRunningArgsSchema = z.object({});
export const LongStuffRunningReturnSchema = z.void();

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
  description: '',
  argsSchema: LongStuffRunningArgsSchema,
  returnSchema: LongStuffRunningReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useLongStuffRunning = () => {
  return useTransportAction(LongStuffRunningDefinition);
};
