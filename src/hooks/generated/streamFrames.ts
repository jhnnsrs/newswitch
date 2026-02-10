import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const StreamFramesArgsSchema = z.object({
  /** Detector slot number */
  slot: z.number().describe('Detector slot number'),
  /** Number of frames to stream */
  num_frames: z.number().describe('Number of frames to stream').optional(),
  /** Target frames per second */
  fps: z.number().describe('Target frames per second').optional(),
});
export const StreamFramesReturnSchema = z.string();

// --- Types ---
export type StreamFramesArgs = z.infer<typeof StreamFramesArgsSchema>;
export type StreamFramesReturn = z.infer<typeof StreamFramesReturnSchema>;

// --- Definition ---
export const StreamFramesDefinition: ActionDefinition<
  StreamFramesArgs,
  StreamFramesReturn
> = {
  name: 'stream_frames',
  description: '',
  argsSchema: StreamFramesArgsSchema,
  returnSchema: StreamFramesReturnSchema,
  lockKeys: ['camera_parameters'],
};

/**
 * undefined
 */
export const useStreamFrames = () => {
  return useTransportAction(StreamFramesDefinition);
};
