import type { ReactNode } from 'react';
import { useState } from 'react';
import { createLockStore, LockStoreContext } from '@/lib/rekuest/locks/store';

export interface LockProviderProps {
  children: ReactNode;
}

export function LockProvider({ children }: LockProviderProps) {
  const [store] = useState(() => createLockStore());

  return <LockStoreContext.Provider value={store}>{children}</LockStoreContext.Provider>;
}
