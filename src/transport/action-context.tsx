import { createContext, useContext } from "react";
import type { ActionContextValue } from "./types";

export const ActionContext = createContext<ActionContextValue | null>(null);

export const useAction = (): ActionContextValue => {
  const context = useContext(ActionContext);

  if (!context) {
    throw new Error("useAction must be used within an ActionProvider");
  }

  return context;
};
