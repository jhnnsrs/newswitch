import type { ActionDefinition } from '../../transport/useTransportAction';
import { ClearExpanseDefinition } from './clearExpanse';
import { SetIlluminationIntensityDefinition } from './setIlluminationIntensity';
import { LongStuffRunningDefinition } from './longStuffRunning';
import { TurnOnIlluminationDefinition } from './turnOnIllumination';
import { TurnOffIlluminationChannelDefinition } from './turnOffIlluminationChannel';
import { FailingCameraDefinition } from './failingCamera';
import { MoveStageDefinition } from './moveStage';
import { MoveHomeDefinition } from './moveHome';
import { KillBenedictDefinition } from './killBenedict';
import { MoveToStagePositionDefinition } from './moveToStagePosition';
import { CaptureImageDefinition } from './captureImage';
import { DumpStatesToStdinDefinition } from './dumpStatesToStdin';
import { StartLiveViewDefinition } from './startLiveView';
import { StopLiveViewDefinition } from './stopLiveView';
import { ActivateDetectorDefinition } from './activateDetector';
import { DeactivateDetectorDefinition } from './deactivateDetector';
import { UpdateDetectorDefinition } from './updateDetector';
import { NeverEndingFunctionDefinition } from './neverEndingFunction';
import { SwitchObjectiveDefinition } from './switchObjective';
import { ToggleObjectiveDefinition } from './toggleObjective';
import { SwitchFilterDefinition } from './switchFilter';
import { ToggleFilterDefinition } from './toggleFilter';
import { AcquireMultidimensionalAcquisitionDefinition } from './acquireMultidimensionalAcquisition';
import { CalibrateLightPathDefinition } from './calibrateLightPath';
import { ScanRegionDefinition } from './scanRegion';

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
  ClearExpanse: ClearExpanseDefinition,
  SetIlluminationIntensity: SetIlluminationIntensityDefinition,
  LongStuffRunning: LongStuffRunningDefinition,
  TurnOnIllumination: TurnOnIlluminationDefinition,
  TurnOffIlluminationChannel: TurnOffIlluminationChannelDefinition,
  FailingCamera: FailingCameraDefinition,
  MoveStage: MoveStageDefinition,
  MoveHome: MoveHomeDefinition,
  KillBenedict: KillBenedictDefinition,
  MoveToStagePosition: MoveToStagePositionDefinition,
  CaptureImage: CaptureImageDefinition,
  DumpStatesToStdin: DumpStatesToStdinDefinition,
  StartLiveView: StartLiveViewDefinition,
  StopLiveView: StopLiveViewDefinition,
  ActivateDetector: ActivateDetectorDefinition,
  DeactivateDetector: DeactivateDetectorDefinition,
  UpdateDetector: UpdateDetectorDefinition,
  NeverEndingFunction: NeverEndingFunctionDefinition,
  SwitchObjective: SwitchObjectiveDefinition,
  ToggleObjective: ToggleObjectiveDefinition,
  SwitchFilter: SwitchFilterDefinition,
  ToggleFilter: ToggleFilterDefinition,
  AcquireMultidimensionalAcquisition:
    AcquireMultidimensionalAcquisitionDefinition,
  CalibrateLightPath: CalibrateLightPathDefinition,
  ScanRegion: ScanRegionDefinition,
} satisfies Record<string, ActionDefinition<unknown, unknown>>;

export type GlobalActionDefinition = typeof globalActionDefinition;
// Backwards-compatible alias for the requested misspelling.
export const globalActionDefintiion = globalActionDefinition;
