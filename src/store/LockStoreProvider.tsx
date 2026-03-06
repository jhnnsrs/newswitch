import type { ReactNode } from "react";
import { useState } from "react";
import { createLockStore, LockStoreContext } from "./lockStore";

interface LockStoreProviderProps {
  children: ReactNode;
}

export function LockStoreProvider({ children }: LockStoreProviderProps) {
  const [store] = useState(() => createLockStore());

  return (
    <LockStoreContext.Provider value={store}>
      {children}
    </LockStoreContext.Provider>
  );
}