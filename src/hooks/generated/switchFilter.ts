import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

/** The newly active filter. */
export const FilterSchema = z.object({
  slot: z.number().optional(),
  name: z.string().optional(),
  center_wavelength: z.number().optional(),
  bandwidth: z.number().optional(),
  transmission: z.number().optional(),
  is_active: z.boolean().optional(),
});
/** The newly active filter. */
export type Filter = z.infer<typeof FilterSchema>;

// --- Schemas ---
export const SwitchFilterArgsSchema = z.object({
  /** Filter slot number */
  slot: z.number().describe('Filter slot number'),
});
export const SwitchFilterReturnSchema = FilterSchema.describe(
  'The newly active filter.',
);

// --- Types ---
export type SwitchFilterArgs = z.infer<typeof SwitchFilterArgsSchema>;
export type SwitchFilterReturn = z.infer<typeof SwitchFilterReturnSchema>;

// --- Definition ---
export const SwitchFilterDefinition: ActionDefinition<
  SwitchFilterArgs,
  SwitchFilterReturn
> = {
  name: 'switch_filter',
  description: '',
  argsSchema: SwitchFilterArgsSchema,
  returnSchema: SwitchFilterReturnSchema,
  lockKeys: ['filter_bank'],
};

/**
 * undefined
 */
export const useSwitchFilter = () => {
  return useTransportAction(SwitchFilterDefinition);
};
