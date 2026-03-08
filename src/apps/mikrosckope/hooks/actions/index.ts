import type { ActionDefinition } from '../useAction';
import { MikrosckopeClearExpanseDefinition } from './clearExpanse';
import { MikrosckopeSetIlluminationIntensityDefinition } from './setIlluminationIntensity';
import { MikrosckopeLongStuffRunningDefinition } from './longStuffRunning';
import { MikrosckopeTurnOnIlluminationDefinition } from './turnOnIllumination';
import { MikrosckopeTurnOffIlluminationChannelDefinition } from './turnOffIlluminationChannel';
import { MikrosckopeFailingCameraDefinition } from './failingCamera';
import { MikrosckopeMoveStageDefinition } from './moveStage';
import { MikrosckopeMoveHomeDefinition } from './moveHome';
import { MikrosckopeKillBenedictDefinition } from './killBenedict';
import { MikrosckopeMoveToStagePositionDefinition } from './moveToStagePosition';
import { MikrosckopeCaptureImageDefinition } from './captureImage';
import { MikrosckopeDumpStatesToStdinDefinition } from './dumpStatesToStdin';
import { MikrosckopeStartLiveViewDefinition } from './startLiveView';
import { MikrosckopeStopLiveViewDefinition } from './stopLiveView';
import { MikrosckopeActivateDetectorDefinition } from './activateDetector';
import { MikrosckopeDeactivateDetectorDefinition } from './deactivateDetector';
import { MikrosckopeUpdateDetectorDefinition } from './updateDetector';
import { MikrosckopeNeverEndingFunctionDefinition } from './neverEndingFunction';
import { MikrosckopeSwitchObjectiveDefinition } from './switchObjective';
import { MikrosckopeToggleObjectiveDefinition } from './toggleObjective';
import { MikrosckopeSwitchFilterDefinition } from './switchFilter';
import { MikrosckopeToggleFilterDefinition } from './toggleFilter';
import { MikrosckopeAcquireMultidimensionalAcquisitionDefinition } from './acquireMultidimensionalAcquisition';
import { MikrosckopeCalibrateLightPathDefinition } from './calibrateLightPath';
import { MikrosckopeScanRegionDefinition } from './scanRegion';

export * from './clearExpanse';
export * from './setIlluminationIntensity';
export * from './longStuffRunning';
export * from './turnOnIllumination';
export * from './turnOffIlluminationChannel';
export * from './failingCamera';
export * from './moveStage';
export * from './moveHome';
export * from './killBenedict';
export * from './moveToStagePosition';
export * from './captureImage';
export * from './dumpStatesToStdin';
export * from './startLiveView';
export * from './stopLiveView';
export * from './activateDetector';
export * from './deactivateDetector';
export * from './updateDetector';
export * from './neverEndingFunction';
export * from './switchObjective';
export * from './toggleObjective';
export * from './switchFilter';
export * from './toggleFilter';
export * from './acquireMultidimensionalAcquisition';
export * from './calibrateLightPath';
export * from './scanRegion';

export const globalActionDefinition = {
  ClearExpanse: MikrosckopeClearExpanseDefinition,
  SetIlluminationIntensity: MikrosckopeSetIlluminationIntensityDefinition,
  LongStuffRunning: MikrosckopeLongStuffRunningDefinition,
  TurnOnIllumination: MikrosckopeTurnOnIlluminationDefinition,
  TurnOffIlluminationChannel: MikrosckopeTurnOffIlluminationChannelDefinition,
  FailingCamera: MikrosckopeFailingCameraDefinition,
  MoveStage: MikrosckopeMoveStageDefinition,
  MoveHome: MikrosckopeMoveHomeDefinition,
  KillBenedict: MikrosckopeKillBenedictDefinition,
  MoveToStagePosition: MikrosckopeMoveToStagePositionDefinition,
  CaptureImage: MikrosckopeCaptureImageDefinition,
  DumpStatesToStdin: MikrosckopeDumpStatesToStdinDefinition,
  StartLiveView: MikrosckopeStartLiveViewDefinition,
  StopLiveView: MikrosckopeStopLiveViewDefinition,
  ActivateDetector: MikrosckopeActivateDetectorDefinition,
  DeactivateDetector: MikrosckopeDeactivateDetectorDefinition,
  UpdateDetector: MikrosckopeUpdateDetectorDefinition,
  NeverEndingFunction: MikrosckopeNeverEndingFunctionDefinition,
  SwitchObjective: MikrosckopeSwitchObjectiveDefinition,
  ToggleObjective: MikrosckopeToggleObjectiveDefinition,
  SwitchFilter: MikrosckopeSwitchFilterDefinition,
  ToggleFilter: MikrosckopeToggleFilterDefinition,
  AcquireMultidimensionalAcquisition:
    MikrosckopeAcquireMultidimensionalAcquisitionDefinition,
  CalibrateLightPath: MikrosckopeCalibrateLightPathDefinition,
  ScanRegion: MikrosckopeScanRegionDefinition,
} satisfies Record<string, ActionDefinition<unknown, unknown>>;

export type GlobalActionDefinition = typeof globalActionDefinition;
// Backwards-compatible alias for the requested misspelling.
export const globalActionDefintiion = globalActionDefinition;
