import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

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
export const MikrosckopeToggleFilterArgsSchema = z.object({});
export const MikrosckopeToggleFilterReturnSchema = z.object({
  /** The newly active filter. */
  return0: MikrosckopeFilterSchema.describe('The newly active filter.'),
});

// --- Types ---
export type MikrosckopeToggleFilterArgs = z.infer<
  typeof MikrosckopeToggleFilterArgsSchema
>;
export type MikrosckopeToggleFilterReturn = z.infer<
  typeof MikrosckopeToggleFilterReturnSchema
>;

export const ToggleFilterArgsSchema = MikrosckopeToggleFilterArgsSchema;
export const ToggleFilterReturnSchema = MikrosckopeToggleFilterReturnSchema;
export type ToggleFilterArgs = MikrosckopeToggleFilterArgs;
export type ToggleFilterReturn = MikrosckopeToggleFilterReturn;

// --- Definition ---
export const MikrosckopeToggleFilterDefinition: ActionDefinition<
  MikrosckopeToggleFilterArgs,
  MikrosckopeToggleFilterReturn
> = {
  name: 'toggle_filter',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeToggleFilterArgsSchema,
  returnSchema: MikrosckopeToggleFilterReturnSchema,
  lockKeys: ['filter_bank'],
};

export const ToggleFilterDefinition = MikrosckopeToggleFilterDefinition;

/**
 * undefined
 */
export const useMikrosckopeToggleFilter = () => {
  return useAction(MikrosckopeToggleFilterDefinition);
};

export const useToggleFilter = useMikrosckopeToggleFilter;
