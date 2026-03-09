import { createContext, useContext } from 'react';

export interface LockContextValue {
  goLive: (appKey: string) => Promise<void>;
  stopLive: (appKey: string) => Promise<void>;
}

export const LockContext = createContext<LockContextValue | null>(null);

export function useLockContext(): LockContextValue {
  const context = useContext(LockContext);

  if (!context) {
    throw new Error('useLockContext must be used within a LockProvider');
  }

  return context;
}