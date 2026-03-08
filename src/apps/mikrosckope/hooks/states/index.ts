import type { StateDefinition } from "../useStateSync";
import { MikrosckopeStageStateDefinition } from "./StageState";
import { MikrosckopeIlluminationStateDefinition } from "./IlluminationState";
import { MikrosckopeCameraStateDefinition } from "./CameraState";
import { MikrosckopeObjectiveStateDefinition } from "./ObjectiveState";
import { MikrosckopeFilterBankStateDefinition } from "./FilterBankState";
import { MikrosckopeIOStateDefinition } from "./IOState";
import { MikrosckopeLightPathStateDefinition } from "./LightPathState";
import { MikrosckopeSerialStateDefinition } from "./SerialState";
import { MikrosckopeHookStateDefinition } from "./HookState";
import { MikrosckopeExpanseStateDefinition } from "./ExpanseState";
import { MikrosckopeCalibrationStateDefinition } from "./CalibrationState";

export { createIndexedUnion } from "./utils";
export {
  MikrosckopeStageStateSchema,
  StageStateSchema,
  MikrosckopeStageStateDefinition,
  StageStateDefinition,
  useMikrosckopeStageState,
  useStageState,
} from "./StageState";
export type { MikrosckopeStageState, StageState } from "./StageState";
export {
  MikrosckopeIlluminationSchema,
  IlluminationSchema,
  MikrosckopeIlluminationStateSchema,
  IlluminationStateSchema,
  MikrosckopeIlluminationStateDefinition,
  IlluminationStateDefinition,
  useMikrosckopeIlluminationState,
  useIlluminationState,
} from "./IlluminationState";
export type {
  MikrosckopeIlluminationState,
  IlluminationState,
} from "./IlluminationState";
export {
  MikrosckopeDetectorSchema,
  DetectorSchema,
  MikrosckopeCameraStateSchema,
  CameraStateSchema,
  MikrosckopeCameraStateDefinition,
  CameraStateDefinition,
  useMikrosckopeCameraState,
  useCameraState,
} from "./CameraState";
export type { MikrosckopeCameraState, CameraState } from "./CameraState";
export {
  MikrosckopeObjectiveLensSchema,
  ObjectiveLensSchema,
  MikrosckopeObjectiveStateSchema,
  ObjectiveStateSchema,
  MikrosckopeObjectiveStateDefinition,
  ObjectiveStateDefinition,
  useMikrosckopeObjectiveState,
  useObjectiveState,
} from "./ObjectiveState";
export type {
  MikrosckopeObjectiveState,
  ObjectiveState,
} from "./ObjectiveState";
export {
  MikrosckopeFilterSchema,
  FilterSchema,
  MikrosckopeFilterBankStateSchema,
  FilterBankStateSchema,
  MikrosckopeFilterBankStateDefinition,
  FilterBankStateDefinition,
  useMikrosckopeFilterBankState,
  useFilterBankState,
} from "./FilterBankState";
export type {
  MikrosckopeFilterBankState,
  FilterBankState,
} from "./FilterBankState";
export {
  MikrosckopeIOStateSchema,
  IOStateSchema,
  MikrosckopeIOStateDefinition,
  IOStateDefinition,
  useMikrosckopeIOState,
  useIOState,
} from "./IOState";
export type { MikrosckopeIOState, IOState } from "./IOState";
export {
  MikrosckopeObjectiveKubeSchema,
  ObjectiveKubeSchema,
  MikrosckopeDetectorKubeSchema,
  DetectorKubeSchema,
  MikrosckopeFilterKubeSchema,
  FilterKubeSchema,
  MikrosckopeIlluminationKubeSchema,
  IlluminationKubeSchema,
  MikrosckopeGenericKubeSchema,
  GenericKubeSchema,
  MikrosckopeStageKubeSchema,
  StageKubeSchema,
  MikrosckopeDichroicKubeSchema,
  DichroicKubeSchema,
  MikrosckopeFilterBankKubeSchema,
  FilterBankKubeSchema,
  MikrosckopeObjectiveTurretKubeSchema,
  ObjectiveTurretKubeSchema,
  MikrosckopeLightEdgeSchema,
  LightEdgeSchema,
  MikrosckopeLightPathSchema,
  LightPathSchema,
  MikrosckopeLightPathStateDefinition,
  LightPathStateDefinition,
  useMikrosckopeLightPathState,
  useLightPathState,
} from "./LightPathState";
export type {
  MikrosckopeLightPathState,
  LightPathState,
} from "./LightPathState";
export {
  MikrosckopeSerialStateSchema,
  SerialStateSchema,
  MikrosckopeSerialStateDefinition,
  SerialStateDefinition,
  useMikrosckopeSerialState,
  useSerialState,
} from "./SerialState";
export type { MikrosckopeSerialState, SerialState } from "./SerialState";
export {
  MikrosckopeRegisteredHookSchema,
  RegisteredHookSchema,
  MikrosckopeHookStateSchema,
  HookStateSchema,
  MikrosckopeHookStateDefinition,
  HookStateDefinition,
  useMikrosckopeHookState,
  useHookState,
} from "./HookState";
export type { MikrosckopeHookState, HookState } from "./HookState";
export {
  MikrosckopeObjectiveKubeStateSchema,
  ObjectiveKubeStateSchema,
  MikrosckopeDetectorKubeStateSchema,
  DetectorKubeStateSchema,
  MikrosckopeFilterKubeStateSchema,
  FilterKubeStateSchema,
  MikrosckopeIlluminationKubeStateSchema,
  IlluminationKubeStateSchema,
  MikrosckopeGenericKubeStateSchema,
  GenericKubeStateSchema,
  MikrosckopeStageKubeStateSchema,
  StageKubeStateSchema,
  MikrosckopeDichroicKubeStateSchema,
  DichroicKubeStateSchema,
  MikrosckopeFilterBankKubeStateSchema,
  FilterBankKubeStateSchema,
  MikrosckopeObjectiveTurretKubeStateSchema,
  ObjectiveTurretKubeStateSchema,
  MikrosckopeLightEdgeStateSchema,
  LightEdgeStateSchema,
  MikrosckopeMetadataSchema,
  MetadataSchema,
  MikrosckopeImageSchema,
  ImageSchema,
  MikrosckopeScaleSchema,
  ScaleSchema,
  MikrosckopeArrayMetadataSchema,
  ArrayMetadataSchema,
  MikrosckopeFrameSchema,
  FrameSchema,
  MikrosckopeExpanseStateSchema,
  ExpanseStateSchema,
  MikrosckopeExpanseStateDefinition,
  ExpanseStateDefinition,
  useMikrosckopeExpanseState,
  useExpanseState,
} from "./ExpanseState";
export type { MikrosckopeExpanseState, ExpanseState } from "./ExpanseState";
export {
  MikrosckopeCalibratedLightPathSchema,
  CalibratedLightPathSchema,
  MikrosckopeCalibrationStateSchema,
  CalibrationStateSchema,
  MikrosckopeCalibrationStateDefinition,
  CalibrationStateDefinition,
  useMikrosckopeCalibrationState,
  useCalibrationState,
} from "./CalibrationState";
export type {
  MikrosckopeCalibrationState,
  CalibrationState,
} from "./CalibrationState";

export const globalStateDefinition = {
  StageState: MikrosckopeStageStateDefinition,
  IlluminationState: MikrosckopeIlluminationStateDefinition,
  CameraState: MikrosckopeCameraStateDefinition,
  ObjectiveState: MikrosckopeObjectiveStateDefinition,
  FilterBankState: MikrosckopeFilterBankStateDefinition,
  IOState: MikrosckopeIOStateDefinition,
  LightPathState: MikrosckopeLightPathStateDefinition,
  SerialState: MikrosckopeSerialStateDefinition,
  HookState: MikrosckopeHookStateDefinition,
  ExpanseState: MikrosckopeExpanseStateDefinition,
  CalibrationState: MikrosckopeCalibrationStateDefinition,
} satisfies Record<string, StateDefinition<unknown>>;

type InferStateDefinition<TDefinition> =
  TDefinition extends StateDefinition<infer TState, string> ? TState : never;

export type GlobalStateDefinition = typeof globalStateDefinition;
export type GlobalStateKey = keyof GlobalStateDefinition;
export type GlobalStateShape = {
  [K in GlobalStateKey]: InferStateDefinition<GlobalStateDefinition[K]>;
};

export const globalStateKeys = Object.values(globalStateDefinition).map(
  (definition) => definition.key,
) as GlobalStateKey[];

// Backwards-compatible alias for the requested misspelling.
export const globalStateDefintiion = globalStateDefinition;
