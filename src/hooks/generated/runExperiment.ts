import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const RunExperimentArgsSchema = z.object({
  slot: z.number().optional(),
  num_z_stacks: z.number().optional(),
  num_frames: z.number().optional(),
  exposure_time: z.number().optional(),
  intensity: z.number().optional(),
  wavelength: z.number().optional(),
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
  name: "run_experiment",
  description: "",
  argsSchema: RunExperimentArgsSchema,
  returnSchema: RunExperimentReturnSchema,
  lockKeys: ["stage_position"],
};

/**
 * undefined
 */
export const useRunExperiment = () => {
  return useTransportAction(RunExperimentDefinition);
};
