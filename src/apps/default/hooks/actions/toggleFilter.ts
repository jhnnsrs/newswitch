import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

/** The newly active filter. */
export const FilterSchema = z
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
export type Filter = z.infer<typeof FilterSchema>;

// --- Schemas ---
export const ToggleFilterArgsSchema = z.object({});
export const ToggleFilterReturnSchema = z.object({
  /** The newly active filter. */
  return0: FilterSchema.describe('The newly active filter.'),
});

// --- Types ---
export type ToggleFilterArgs = z.infer<typeof ToggleFilterArgsSchema>;
export type ToggleFilterReturn = z.infer<typeof ToggleFilterReturnSchema>;

// --- Definition ---
export const ToggleFilterDefinition: ActionDefinition<
  ToggleFilterArgs,
  ToggleFilterReturn
> = {
  name: 'toggle_filter',
  appKey: 'default',
  description: '',
  argsSchema: ToggleFilterArgsSchema,
  returnSchema: ToggleFilterReturnSchema,
  lockKeys: ['filter_bank'],
};

/**
 * undefined
 */
export const useToggleFilter = () => {
  return useTransportAction(ToggleFilterDefinition);
};
