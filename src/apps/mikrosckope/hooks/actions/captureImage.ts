import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeCaptureImageArgsSchema = z.object({});
export const MikrosckopeCaptureImageReturnSchema = z.object({
  return0: z.string(),
});

// --- Types ---
export type MikrosckopeCaptureImageArgs = z.infer<
  typeof MikrosckopeCaptureImageArgsSchema
>;
export type MikrosckopeCaptureImageReturn = z.infer<
  typeof MikrosckopeCaptureImageReturnSchema
>;

export const CaptureImageArgsSchema = MikrosckopeCaptureImageArgsSchema;
export const CaptureImageReturnSchema = MikrosckopeCaptureImageReturnSchema;
export type CaptureImageArgs = MikrosckopeCaptureImageArgs;
export type CaptureImageReturn = MikrosckopeCaptureImageReturn;

// --- Definition ---
export const MikrosckopeCaptureImageDefinition: ActionDefinition<
  MikrosckopeCaptureImageArgs,
  MikrosckopeCaptureImageReturn
> = {
  name: 'capture_image',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeCaptureImageArgsSchema,
  returnSchema: MikrosckopeCaptureImageReturnSchema,
  lockKeys: ['camera_parameters', 'expanse_state', 'io'],
};

export const CaptureImageDefinition = MikrosckopeCaptureImageDefinition;

/**
 * undefined
 */
export const useMikrosckopeCaptureImage = () => {
  return useTransportAction(MikrosckopeCaptureImageDefinition);
};

export const useCaptureImage = useMikrosckopeCaptureImage;
