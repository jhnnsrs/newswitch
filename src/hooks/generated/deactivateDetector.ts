import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const DeactivateDetectorArgsSchema = z.object({
  /** Detector slot number to deactivate */
  slot: z.number().describe('Detector slot number to deactivate'),
});
export const DeactivateDetectorReturnSchema = z.string();

// --- Types ---
export type DeactivateDetectorArgs = z.infer<
  typeof DeactivateDetectorArgsSchema
>;
export type DeactivateDetectorReturn = z.infer<
  typeof DeactivateDetectorReturnSchema
>;

// --- Definition ---
export const DeactivateDetectorDefinition: ActionDefinition<
  DeactivateDetectorArgs,
  DeactivateDetectorReturn
> = {
  name: 'deactivate_detector',
  description: '',
  argsSchema: DeactivateDetectorArgsSchema,
  returnSchema: DeactivateDetectorReturnSchema,
  lockKeys: ['camera_parameters'],
};

/**
 * undefined
 */
export const useDeactivateDetector = () => {
  return useTransportAction(DeactivateDetectorDefinition);
};
