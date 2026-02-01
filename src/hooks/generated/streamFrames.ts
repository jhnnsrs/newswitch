import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const StreamFramesArgsSchema = z.object({
  num_frames: z.number().optional(),
  fps: z.number().optional(),
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
  name: "stream_frames",
  description: "",
  argsSchema: StreamFramesArgsSchema,
  returnSchema: StreamFramesReturnSchema,
  lockKeys: [],
};

/**
 * undefined
 */
export const useStreamFrames = () => {
  return useTransportAction(StreamFramesDefinition);
};
