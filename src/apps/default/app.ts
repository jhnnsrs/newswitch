import type { AppDefinition } from '@/lib/rekuest';
import {
  globalActionDefinition,
  type GlobalActionDefinition,
} from './hooks/actions';
import { globalLockDefinition, type GlobalLockDefinition } from './hooks/locks';
import {
  globalStateDefinition,
  type GlobalStateDefinition,
} from './hooks/states';

export const appDefinition = {
  key: 'default',
  actions: globalActionDefinition,
  locks: globalLockDefinition,
  states: globalStateDefinition,
} satisfies AppDefinition<
  'default',
  GlobalActionDefinition,
  GlobalLockDefinition,
  GlobalStateDefinition
>;
