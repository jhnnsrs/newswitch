import { z } from "zod";
import { useAction, type ActionDefinition } from "../useAction";

// --- Schemas ---
export const RunExperimentArgsSchema = z.object({
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
  description: "Run a simple acquisition experiment.",
  argsSchema: RunExperimentArgsSchema,
  returnSchema: RunExperimentReturnSchema,
};

/**
 * Run a simple acquisition experiment.
 */
export const useRunExperiment = () => {
  return useAction(RunExperimentDefinition);
};
