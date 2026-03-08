import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

/** The newly active filter. */
export const MikrosckopeFilterSchema = z
  .object({
    slot: z.number().optional(),
    name: z.string().optional(),
    center_wavelength: z.number().optional(),
    bandwidth: z.number().optional(),
    transmission: z.number().optional(),
    is_active: z.boolean().optional(),
  })
  .brand('filter');
/** The newly active filter. */
export type MikrosckopeFilter = z.infer<typeof MikrosckopeFilterSchema>;
export const FilterSchema = MikrosckopeFilterSchema;
export type Filter = MikrosckopeFilter;

// --- Schemas ---
export const MikrosckopeSwitchFilterArgsSchema = z.object({
  /** Filter slot number */
  slot: z.number().describe('Filter slot number'),
});
export const MikrosckopeSwitchFilterReturnSchema = z.object({
  /** The newly active filter. */
  return0: MikrosckopeFilterSchema.describe('The newly active filter.'),
});

// --- Types ---
export type MikrosckopeSwitchFilterArgs = z.infer<
  typeof MikrosckopeSwitchFilterArgsSchema
>;
export type MikrosckopeSwitchFilterReturn = z.infer<
  typeof MikrosckopeSwitchFilterReturnSchema
>;

export const SwitchFilterArgsSchema = MikrosckopeSwitchFilterArgsSchema;
export const SwitchFilterReturnSchema = MikrosckopeSwitchFilterReturnSchema;
export type SwitchFilterArgs = MikrosckopeSwitchFilterArgs;
export type SwitchFilterReturn = MikrosckopeSwitchFilterReturn;

// --- Definition ---
export const MikrosckopeSwitchFilterDefinition: ActionDefinition<
  MikrosckopeSwitchFilterArgs,
  MikrosckopeSwitchFilterReturn
> = {
  name: 'switch_filter',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeSwitchFilterArgsSchema,
  returnSchema: MikrosckopeSwitchFilterReturnSchema,
  lockKeys: ['filter_bank'],
};

export const SwitchFilterDefinition = MikrosckopeSwitchFilterDefinition;

/**
 * undefined
 */
export const useMikrosckopeSwitchFilter = () => {
  return useTransportAction(MikrosckopeSwitchFilterDefinition);
};

export const useSwitchFilter = useMikrosckopeSwitchFilter;
