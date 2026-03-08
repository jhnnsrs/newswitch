import { z } from 'zod';
import { useAction, type ActionDefinition } from '../useAction';

// --- Shared Models ---

// --- Schemas ---
export const StopLiveViewArgsSchema = z.object({});
export const StopLiveViewReturnSchema = z.object({
  return0: z.string(),
});

// --- Types ---
export type StopLiveViewArgs = z.infer<typeof StopLiveViewArgsSchema>;
export type StopLiveViewReturn = z.infer<typeof StopLiveViewReturnSchema>;

// --- Definition ---
export const StopLiveViewDefinition: ActionDefinition<
  StopLiveViewArgs,
  StopLiveViewReturn
> = {
  name: 'stop_live_view',
  appKey: 'default',
  description: '',
  argsSchema: StopLiveViewArgsSchema,
  returnSchema: StopLiveViewReturnSchema,
  lockKeys: ['camera_parameters'],
};

/**
 * undefined
 */
export const useStopLiveView = () => {
  return useAction(StopLiveViewDefinition);
};
