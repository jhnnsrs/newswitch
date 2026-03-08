import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const CaptureImageArgsSchema = z.object({});
export const CaptureImageReturnSchema = z.object({
  return0: z.string(),
});

// --- Types ---
export type CaptureImageArgs = z.infer<typeof CaptureImageArgsSchema>;
export type CaptureImageReturn = z.infer<typeof CaptureImageReturnSchema>;

// --- Definition ---
export const CaptureImageDefinition: ActionDefinition<
  CaptureImageArgs,
  CaptureImageReturn
> = {
  name: 'capture_image',
  appKey: 'default',
  description: '',
  argsSchema: CaptureImageArgsSchema,
  returnSchema: CaptureImageReturnSchema,
  lockKeys: ['camera_parameters', 'expanse_state', 'io'],
};

/**
 * undefined
 */
export const useCaptureImage = () => {
  return useAction(CaptureImageDefinition);
};
