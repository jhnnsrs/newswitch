import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const ActivateDetectorArgsSchema = z.object({
  /** Detector slot number to activate */
  slot: z.number().describe('Detector slot number to activate'),
});
export const ActivateDetectorReturnSchema = z.object({});

// --- Types ---
export type ActivateDetectorArgs = z.infer<typeof ActivateDetectorArgsSchema>;
export type ActivateDetectorReturn = z.infer<
  typeof ActivateDetectorReturnSchema
>;

// --- Definition ---
export const ActivateDetectorDefinition: ActionDefinition<
  ActivateDetectorArgs,
  ActivateDetectorReturn
> = {
  name: 'activate_detector',
  appKey: 'default',
  description: '',
  argsSchema: ActivateDetectorArgsSchema,
  returnSchema: ActivateDetectorReturnSchema,
  lockKeys: ['camera_parameters'],
};

/**
 * undefined
 */
export const useActivateDetector = () => {
  return useAction(ActivateDetectorDefinition);
};
