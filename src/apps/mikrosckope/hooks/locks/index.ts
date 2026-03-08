import type { LockDefinition } from "../useLockSync";
import { MikrosckopeExpanseStateDefinition } from "./ExpanseState";
import { MikrosckopeIlluminationDefinition } from "./Illumination";
import { MikrosckopeStagePositionDefinition } from "./StagePosition";
import { MikrosckopeCameraParametersDefinition } from "./CameraParameters";
import { MikrosckopeIoDefinition } from "./Io";
import { MikrosckopeObjectiveDefinition } from "./Objective";
import { MikrosckopeFilterBankDefinition } from "./FilterBank";
import { MikrosckopeHookRegistryDefinition } from "./HookRegistry";

export {
  MikrosckopeExpanseStateDefinition,
  useMikrosckopeExpanseStateLock,
  useExpanseStateLock,
  ExpanseStateDefinition,
} from "./ExpanseState";
export {
  MikrosckopeIlluminationDefinition,
  useMikrosckopeIlluminationLock,
  useIlluminationLock,
  IlluminationDefinition,
} from "./Illumination";
export {
  MikrosckopeStagePositionDefinition,
  useMikrosckopeStagePositionLock,
  useStagePositionLock,
  StagePositionDefinition,
} from "./StagePosition";
export {
  MikrosckopeCameraParametersDefinition,
  useMikrosckopeCameraParametersLock,
  useCameraParametersLock,
  CameraParametersDefinition,
} from "./CameraParameters";
export {
  MikrosckopeIoDefinition,
  useMikrosckopeIoLock,
  useIoLock,
  IoDefinition,
} from "./Io";
export {
  MikrosckopeObjectiveDefinition,
  useMikrosckopeObjectiveLock,
  useObjectiveLock,
  ObjectiveDefinition,
} from "./Objective";
export {
  MikrosckopeFilterBankDefinition,
  useMikrosckopeFilterBankLock,
  useFilterBankLock,
  FilterBankDefinition,
} from "./FilterBank";
export {
  MikrosckopeHookRegistryDefinition,
  useMikrosckopeHookRegistryLock,
  useHookRegistryLock,
  HookRegistryDefinition,
} from "./HookRegistry";

export const globalLockDefinition = {
  ExpanseState: MikrosckopeExpanseStateDefinition,
  Illumination: MikrosckopeIlluminationDefinition,
  StagePosition: MikrosckopeStagePositionDefinition,
  CameraParameters: MikrosckopeCameraParametersDefinition,
  Io: MikrosckopeIoDefinition,
  Objective: MikrosckopeObjectiveDefinition,
  FilterBank: MikrosckopeFilterBankDefinition,
  HookRegistry: MikrosckopeHookRegistryDefinition,
} satisfies Record<string, LockDefinition<string>>;

export type GlobalLockDefinition = typeof globalLockDefinition;
type InferLockKey<TDefinition> =
  TDefinition extends LockDefinition<infer TKey> ? TKey : never;

export type GlobalLockKey = InferLockKey<
  GlobalLockDefinition[keyof GlobalLockDefinition]
>;
export const globalLockKeys = Object.values(globalLockDefinition).map(
  (definition) => definition.key,
) as GlobalLockKey[];

// Backwards-compatible alias for the requested misspelling.
export const globalLockDefintiion = globalLockDefinition;
