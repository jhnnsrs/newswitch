import { z } from "zod";
import {
  useTransportAction,
  type ActionDefinition,
} from "../../transport/useTransportAction";

// --- Schemas ---
export const FailingCameraArgsSchema = z.object({
  intensity: z.number(),
});
export const FailingCameraReturnSchema = z.string();

// --- Types ---
export type FailingCameraArgs = z.infer<typeof FailingCameraArgsSchema>;
export type FailingCameraReturn = z.infer<typeof FailingCameraReturnSchema>;

// --- Definition ---
export const FailingCameraDefinition: ActionDefinition<
  FailingCameraArgs,
  FailingCameraReturn
> = {
  name: "failing_camera",
  description: "",
  argsSchema: FailingCameraArgsSchema,
  returnSchema: FailingCameraReturnSchema,
  lockKeys: [
    "s",
    "t",
    "a",
    "g",
    "e",
    "_",
    "p",
    "o",
    "s",
    "i",
    "t",
    "i",
    "o",
    "n",
  ],
};

/**
 * undefined
 */
export const useFailingCamera = () => {
  return useTransportAction(FailingCameraDefinition);
};
