import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const CaptureImageArgsSchema = z.object({
  /** Detector slot number */
  slot: z.number().describe('Detector slot number').optional(),
});
export const CaptureImageReturnSchema = z.string();

// --- Types ---
export type CaptureImageArgs = z.infer<typeof CaptureImageArgsSchema>;
export type CaptureImageReturn = z.infer<typeof CaptureImageReturnSchema>;

// --- Definition ---
export const CaptureImageDefinition: ActionDefinition<
  CaptureImageArgs,
  CaptureImageReturn
> = {
  name: 'capture_image',
  description: '',
  argsSchema: CaptureImageArgsSchema,
  returnSchema: CaptureImageReturnSchema,
  lockKeys: ['camera_parameters', 'io'],
};

/**
 * undefined
 */
export const useCaptureImage = () => {
  return useTransportAction(CaptureImageDefinition);
};
