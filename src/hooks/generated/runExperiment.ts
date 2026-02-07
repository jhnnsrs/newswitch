import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../../transport/useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const RunExperimentArgsSchema = z.object({
  /** Detector slot number */
  slot: z.number().describe('Detector slot number').optional(),
  /** Number of Z-stacks to acquire */
  num_z_stacks: z.number().describe('Number of Z-stacks to acquire').optional(),
  /** Number of frames to capture */
  num_frames: z.number().describe('Number of frames to capture').optional(),
  /** Exposure time per frame in seconds */
  exposure_time: z
    .number()
    .describe('Exposure time per frame in seconds')
    .optional(),
  /** Illumination intensity (0-100) */
  intensity: z.number().describe('Illumination intensity (0-100)').optional(),
  /** Illumination wavelength in nm */
  wavelength: z.number().describe('Illumination wavelength in nm').optional(),
});
export const RunExperimentReturnSchema = z.array(z.record(z.string(), z.any()));

// --- Types ---
export type RunExperimentArgs = z.infer<typeof RunExperimentArgsSchema>;
export type RunExperimentReturn = z.infer<typeof RunExperimentReturnSchema>;

// --- Definition ---
export const RunExperimentDefinition: ActionDefinition<
  RunExperimentArgs,
  RunExperimentReturn
> = {
  name: 'run_experiment',
  description: '',
  argsSchema: RunExperimentArgsSchema,
  returnSchema: RunExperimentReturnSchema,
  lockKeys: ['stage_position'],
};

/**
 * undefined
 */
export const useRunExperiment = () => {
  return useTransportAction(RunExperimentDefinition);
};
