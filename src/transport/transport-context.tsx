import { createContext, useContext } from "react";
import type { TransportContextValue } from "./types";

export const TransportContext = createContext<TransportContextValue | null>(
  null,
);

export const useTransport = (): TransportContextValue => {
  const context = useContext(TransportContext);

  if (!context) {
    throw new Error("useTransport must be used within a TransportProvider");
  }

  return context;
};
