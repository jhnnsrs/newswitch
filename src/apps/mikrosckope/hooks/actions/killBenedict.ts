import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeKillBenedictArgsSchema = z.object({
  kill_hard: z.string(),
  die_young: z.boolean(),
});
export const MikrosckopeKillBenedictReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeKillBenedictArgs = z.infer<
  typeof MikrosckopeKillBenedictArgsSchema
>;
export type MikrosckopeKillBenedictReturn = z.infer<
  typeof MikrosckopeKillBenedictReturnSchema
>;

export const KillBenedictArgsSchema = MikrosckopeKillBenedictArgsSchema;
export const KillBenedictReturnSchema = MikrosckopeKillBenedictReturnSchema;
export type KillBenedictArgs = MikrosckopeKillBenedictArgs;
export type KillBenedictReturn = MikrosckopeKillBenedictReturn;

// --- Definition ---
export const MikrosckopeKillBenedictDefinition: ActionDefinition<
  MikrosckopeKillBenedictArgs,
  MikrosckopeKillBenedictReturn
> = {
  name: 'kill_benedict',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeKillBenedictArgsSchema,
  returnSchema: MikrosckopeKillBenedictReturnSchema,
  lockKeys: ['stage_position'],
};

export const KillBenedictDefinition = MikrosckopeKillBenedictDefinition;

/**
 * undefined
 */
export const useMikrosckopeKillBenedict = () => {
  return useAction(MikrosckopeKillBenedictDefinition);
};

export const useKillBenedict = useMikrosckopeKillBenedict;
