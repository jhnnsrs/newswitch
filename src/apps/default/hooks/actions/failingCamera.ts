import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const FailingCameraArgsSchema = z.object({
  intensity: z.number(),
});
export const FailingCameraReturnSchema = z.object({
  return0: z.string(),
});

// --- Types ---
export type FailingCameraArgs = z.infer<typeof FailingCameraArgsSchema>;
export type FailingCameraReturn = z.infer<typeof FailingCameraReturnSchema>;

// --- Definition ---
export const FailingCameraDefinition: ActionDefinition<
  FailingCameraArgs,
  FailingCameraReturn
> = {
  name: 'failing_camera',
  appKey: 'default',
  description: '',
  argsSchema: FailingCameraArgsSchema,
  returnSchema: FailingCameraReturnSchema,
  lockKeys: ['stage_position'],
};

/**
 * undefined
 */
export const useFailingCamera = () => {
  return useTransportAction(FailingCameraDefinition);
};
