import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeActivateDetectorArgsSchema = z.object({
  /** Detector slot number to activate */
  slot: z.number().describe('Detector slot number to activate'),
});
export const MikrosckopeActivateDetectorReturnSchema = z.object({});

// --- Types ---
export type MikrosckopeActivateDetectorArgs = z.infer<
  typeof MikrosckopeActivateDetectorArgsSchema
>;
export type MikrosckopeActivateDetectorReturn = z.infer<
  typeof MikrosckopeActivateDetectorReturnSchema
>;

export const ActivateDetectorArgsSchema = MikrosckopeActivateDetectorArgsSchema;
export const ActivateDetectorReturnSchema =
  MikrosckopeActivateDetectorReturnSchema;
export type ActivateDetectorArgs = MikrosckopeActivateDetectorArgs;
export type ActivateDetectorReturn = MikrosckopeActivateDetectorReturn;

// --- Definition ---
export const MikrosckopeActivateDetectorDefinition: ActionDefinition<
  MikrosckopeActivateDetectorArgs,
  MikrosckopeActivateDetectorReturn
> = {
  name: 'activate_detector',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeActivateDetectorArgsSchema,
  returnSchema: MikrosckopeActivateDetectorReturnSchema,
  lockKeys: ['camera_parameters'],
};

export const ActivateDetectorDefinition = MikrosckopeActivateDetectorDefinition;

/**
 * undefined
 */
export const useMikrosckopeActivateDetector = () => {
  return useTransportAction(MikrosckopeActivateDetectorDefinition);
};

export const useActivateDetector = useMikrosckopeActivateDetector;
