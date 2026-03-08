import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeFailingCameraArgsSchema = z.object({
  intensity: z.number(),
});
export const MikrosckopeFailingCameraReturnSchema = z.object({
  return0: z.string(),
});

// --- Types ---
export type MikrosckopeFailingCameraArgs = z.infer<
  typeof MikrosckopeFailingCameraArgsSchema
>;
export type MikrosckopeFailingCameraReturn = z.infer<
  typeof MikrosckopeFailingCameraReturnSchema
>;

export const FailingCameraArgsSchema = MikrosckopeFailingCameraArgsSchema;
export const FailingCameraReturnSchema = MikrosckopeFailingCameraReturnSchema;
export type FailingCameraArgs = MikrosckopeFailingCameraArgs;
export type FailingCameraReturn = MikrosckopeFailingCameraReturn;

// --- Definition ---
export const MikrosckopeFailingCameraDefinition: ActionDefinition<
  MikrosckopeFailingCameraArgs,
  MikrosckopeFailingCameraReturn
> = {
  name: 'failing_camera',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeFailingCameraArgsSchema,
  returnSchema: MikrosckopeFailingCameraReturnSchema,
  lockKeys: ['stage_position'],
};

export const FailingCameraDefinition = MikrosckopeFailingCameraDefinition;

/**
 * undefined
 */
export const useMikrosckopeFailingCamera = () => {
  return useAction(MikrosckopeFailingCameraDefinition);
};

export const useFailingCamera = useMikrosckopeFailingCamera;
