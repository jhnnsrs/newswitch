import { createContext, useContext } from "react";
import type { GlobalStateDefinition, GlobalStateKey, GlobalStateShape } from "./states";

export interface StateContextValue {
  definitions: GlobalStateDefinition;
  ensureState: <TKey extends GlobalStateKey>(key: TKey) => Promise<void>;
  refetchState: <TKey extends GlobalStateKey>(
    key: TKey,
  ) => Promise<GlobalStateShape[TKey]>;
}

export const StateContext = createContext<StateContextValue | null>(null);

export function useStateContext(): StateContextValue {
  const context = useContext(StateContext);

  if (!context) {
    throw new Error("useStateContext must be used within a StateProvider");
  }

  return context;
}