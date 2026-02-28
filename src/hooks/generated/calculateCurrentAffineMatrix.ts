import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const CalculateCurrentAffineMatrixArgsSchema = z.object({});
export const CalculateCurrentAffineMatrixReturnSchema = z.object({
  /** List of acquired images with metadata. */
  return0: z
    .array(z.array(z.number()))
    .describe('List of acquired images with metadata.'),
});

// --- Types ---
export type CalculateCurrentAffineMatrixArgs = z.infer<
  typeof CalculateCurrentAffineMatrixArgsSchema
>;
export type CalculateCurrentAffineMatrixReturn = z.infer<
  typeof CalculateCurrentAffineMatrixReturnSchema
>;

// --- Definition ---
export const CalculateCurrentAffineMatrixDefinition: ActionDefinition<
  CalculateCurrentAffineMatrixArgs,
  CalculateCurrentAffineMatrixReturn
> = {
  name: 'calculate_current_affine_matrix',
  description: '',
  argsSchema: CalculateCurrentAffineMatrixArgsSchema,
  returnSchema: CalculateCurrentAffineMatrixReturnSchema,
  lockKeys: ['camera_parameters', 'objective', 'stage_position'],
};

/**
 * undefined
 */
export const useCalculateCurrentAffineMatrix = () => {
  return useTransportAction(CalculateCurrentAffineMatrixDefinition);
};
