import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeLongStuffRunningArgsSchema = z.object({});
export const MikrosckopeLongStuffRunningReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeLongStuffRunningArgs = z.infer<
  typeof MikrosckopeLongStuffRunningArgsSchema
>;
export type MikrosckopeLongStuffRunningReturn = z.infer<
  typeof MikrosckopeLongStuffRunningReturnSchema
>;

export const LongStuffRunningArgsSchema = MikrosckopeLongStuffRunningArgsSchema;
export const LongStuffRunningReturnSchema =
  MikrosckopeLongStuffRunningReturnSchema;
export type LongStuffRunningArgs = MikrosckopeLongStuffRunningArgs;
export type LongStuffRunningReturn = MikrosckopeLongStuffRunningReturn;

// --- Definition ---
export const MikrosckopeLongStuffRunningDefinition: ActionDefinition<
  MikrosckopeLongStuffRunningArgs,
  MikrosckopeLongStuffRunningReturn
> = {
  name: 'long_stuff_running',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeLongStuffRunningArgsSchema,
  returnSchema: MikrosckopeLongStuffRunningReturnSchema,
  lockKeys: [],
};

export const LongStuffRunningDefinition = MikrosckopeLongStuffRunningDefinition;

/**
 * undefined
 */
export const useMikrosckopeLongStuffRunning = () => {
  return useTransportAction(MikrosckopeLongStuffRunningDefinition);
};

export const useLongStuffRunning = useMikrosckopeLongStuffRunning;
