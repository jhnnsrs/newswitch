import type { LockDefinition } from "../useLockSync";
import { MikrosckopeExpanseStateDefinition } from "./ExpanseState";
import { MikrosckopeIlluminationDefinition } from "./Illumination";
import { MikrosckopeStagePositionDefinition } from "./StagePosition";
import { MikrosckopeIoDefinition } from "./Io";
import { MikrosckopeCameraParametersDefinition } from "./CameraParameters";
import { MikrosckopeFilterBankDefinition } from "./FilterBank";
import { MikrosckopeObjectiveDefinition } from "./Objective";
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
  MikrosckopeIoDefinition,
  useMikrosckopeIoLock,
  useIoLock,
  IoDefinition,
} from "./Io";
export {
  MikrosckopeCameraParametersDefinition,
  useMikrosckopeCameraParametersLock,
  useCameraParametersLock,
  CameraParametersDefinition,
} from "./CameraParameters";
export {
  MikrosckopeFilterBankDefinition,
  useMikrosckopeFilterBankLock,
  useFilterBankLock,
  FilterBankDefinition,
} from "./FilterBank";
export {
  MikrosckopeObjectiveDefinition,
  useMikrosckopeObjectiveLock,
  useObjectiveLock,
  ObjectiveDefinition,
} from "./Objective";
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
  Io: MikrosckopeIoDefinition,
  CameraParameters: MikrosckopeCameraParametersDefinition,
  FilterBank: MikrosckopeFilterBankDefinition,
  Objective: MikrosckopeObjectiveDefinition,
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
