import { createContext, useContext } from "react";
import type { AppKey } from "@/apps";
import type { StateDefinition } from "@/lib/rekuest/state";

export interface StateContextValue {
  definitions: Record<string, StateDefinition<Record<string, unknown>, string> & { appKey: AppKey }>;
  ensureState: <T extends Record<string, unknown>, TKey extends string>(
    definition: StateDefinition<T, TKey>,
  ) => Promise<void>;
  refetchState: <T extends Record<string, unknown>, TKey extends string>(
    definition: StateDefinition<T, TKey>,
  ) => Promise<T>;
}

export const StateContext = createContext<StateContextValue | null>(null);

export function useStateContext(): StateContextValue {
  const context = useContext(StateContext);

  if (!context) {
    throw new Error("useStateContext must be used within a StateProvider");
  }

  return context;
}