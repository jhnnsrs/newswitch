import { createContext, useContext } from "react";
import type { StateDefinition } from "@/lib/rekuest/state";
import type { RevisedStatesSnapshotMap } from '@/lib/rekuest/transport/types';

export interface CheckoutStateOptions {
  appKey?: string;
  stateKeys?: string[];
}

export interface StateContextValue {
  definitions: Record<string, StateDefinition<Record<string, unknown>, string> & { appKey: string }>;
  ensureState: <T extends Record<string, unknown>, TKey extends string>(
    definition: StateDefinition<T, TKey>,
  ) => Promise<void>;
  refetchState: <T extends Record<string, unknown>, TKey extends string>(
    definition: StateDefinition<T, TKey>,
  ) => Promise<T>;
  checkout: (
    globalRevisionId: string | number,
    options?: CheckoutStateOptions,
  ) => Promise<RevisedStatesSnapshotMap>;
}

export const StateContext = createContext<StateContextValue | null>(null);

export function useStateContext(): StateContextValue {
  const context = useContext(StateContext);

  if (!context) {
    throw new Error("useStateContext must be used within a StateProvider");
  }

  return context;
}