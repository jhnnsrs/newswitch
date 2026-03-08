import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const KillBenedictArgsSchema = z.object({
  kill_hard: z.string(),
  die_young: z.boolean(),
});
export const KillBenedictReturnSchema = z.object({});

// --- Types ---
export type KillBenedictArgs = z.infer<typeof KillBenedictArgsSchema>;
export type KillBenedictReturn = z.infer<typeof KillBenedictReturnSchema>;

// --- Definition ---
export const KillBenedictDefinition: ActionDefinition<
  KillBenedictArgs,
  KillBenedictReturn
> = {
  name: 'kill_benedict',
  appKey: 'default',
  description: '',
  argsSchema: KillBenedictArgsSchema,
  returnSchema: KillBenedictReturnSchema,
  lockKeys: ['stage_position'],
};

/**
 * undefined
 */
export const useKillBenedict = () => {
  return useTransportAction(KillBenedictDefinition);
};
