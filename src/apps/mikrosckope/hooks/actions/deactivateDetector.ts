import { z } from 'zod';
import {
  useTransportAction,
  type ActionDefinition,
} from '../useTransportAction';

// --- Shared Models ---

// --- Schemas ---
export const MikrosckopeDeactivateDetectorArgsSchema = z.object({
  /** Detector slot number to deactivate */
  slot: z.number().describe('Detector slot number to deactivate'),
});
export const MikrosckopeDeactivateDetectorReturnSchema = z.object({
  return0: z.string(),
});

// --- Types ---
export type MikrosckopeDeactivateDetectorArgs = z.infer<
  typeof MikrosckopeDeactivateDetectorArgsSchema
>;
export type MikrosckopeDeactivateDetectorReturn = z.infer<
  typeof MikrosckopeDeactivateDetectorReturnSchema
>;

export const DeactivateDetectorArgsSchema =
  MikrosckopeDeactivateDetectorArgsSchema;
export const DeactivateDetectorReturnSchema =
  MikrosckopeDeactivateDetectorReturnSchema;
export type DeactivateDetectorArgs = MikrosckopeDeactivateDetectorArgs;
export type DeactivateDetectorReturn = MikrosckopeDeactivateDetectorReturn;

// --- Definition ---
export const MikrosckopeDeactivateDetectorDefinition: ActionDefinition<
  MikrosckopeDeactivateDetectorArgs,
  MikrosckopeDeactivateDetectorReturn
> = {
  name: 'deactivate_detector',
  appKey: 'mikrosckope',
  description: '',
  argsSchema: MikrosckopeDeactivateDetectorArgsSchema,
  returnSchema: MikrosckopeDeactivateDetectorReturnSchema,
  lockKeys: ['camera_parameters'],
};

export const DeactivateDetectorDefinition =
  MikrosckopeDeactivateDetectorDefinition;

/**
 * undefined
 */
export const useMikrosckopeDeactivateDetector = () => {
  return useTransportAction(MikrosckopeDeactivateDetectorDefinition);
};

export const useDeactivateDetector = useMikrosckopeDeactivateDetector;
