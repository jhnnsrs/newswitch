import type { ReactNode } from 'react';
import { useState } from 'react';
import { defaultAppKey } from '@/apps';
import { createLockStoreRegistry, LockStoreContext } from '@/lib/rekuest/locks/store';

export interface LockProviderProps {
  children: ReactNode;
}

export function LockProvider({ children }: LockProviderProps) {
  const [store] = useState(() => createLockStoreRegistry(defaultAppKey));

  return <LockStoreContext.Provider value={store}>{children}</LockStoreContext.Provider>;
}
