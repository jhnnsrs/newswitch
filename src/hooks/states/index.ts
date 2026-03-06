import type { StateDefinition } from "../useStateSync";
import { StageStateDefinition } from "./StageState";
import { IlluminationStateDefinition } from "./IlluminationState";
import { CameraStateDefinition } from "./CameraState";
import { ObjectiveStateDefinition } from "./ObjectiveState";
import { FilterBankStateDefinition } from "./FilterBankState";
import { IOStateDefinition } from "./IOState";
import { LightPathStateDefinition } from "./LightPathState";
import { SerialStateDefinition } from "./SerialState";
import { HookStateDefinition } from "./HookState";
import { ExpanseStateDefinition } from "./ExpanseState";
import { CalibrationStateDefinition } from "./CalibrationState";

export * from "./utils";
export * from "./StageState";
export * from "./IlluminationState";
export * from "./CameraState";
export * from "./ObjectiveState";
export * from "./FilterBankState";
export * from "./IOState";
export * from "./LightPathState";
export * from "./SerialState";
export * from "./HookState";
export * from "./ExpanseState";
export * from "./CalibrationState";

export const globalStateDefinition = {
  StageState: StageStateDefinition,
  IlluminationState: IlluminationStateDefinition,
  CameraState: CameraStateDefinition,
  ObjectiveState: ObjectiveStateDefinition,
  FilterBankState: FilterBankStateDefinition,
  IOState: IOStateDefinition,
  LightPathState: LightPathStateDefinition,
  SerialState: SerialStateDefinition,
  HookState: HookStateDefinition,
  ExpanseState: ExpanseStateDefinition,
  CalibrationState: CalibrationStateDefinition,
} satisfies Record<string, StateDefinition<unknown>>;

// Backwards-compatible alias for the requested misspelling.
export const globalStateDefintiion = globalStateDefinition;
