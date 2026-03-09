import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LockContext, type LockContextValue } from '@/lib/rekuest/locks/lock-context';
import { useLockStoreRegistry } from '@/lib/rekuest/locks/store';
import { useTransport } from '@/lib/rekuest/transport/transport-context';
import {
  LockEventType,
  type LockTransportMessage,
  type TransportMessageSubscription,
} from '@/lib/rekuest/transport/types';
import type { AppKey } from '@/lib/rekuest/types';

export interface LockProviderProps {
  children: ReactNode;
}

export function LockProvider({ children }: LockProviderProps) {
  const transport = useTransport();
  const lockStoreRegistry = useLockStoreRegistry();
  const subscriptionsRef = useRef(new Map<AppKey, TransportMessageSubscription>());

  const handleMessage = useCallback(
    (appKey: AppKey, message: LockTransportMessage) => {
      const store = lockStoreRegistry.getStoreApi(appKey).getState();

      switch (message.type) {
        case LockEventType.LOCK:
          store.setLock(message.key, message.assignation);
          return;
        case LockEventType.UNLOCK:
          store.setLock(message.key, undefined);
          return;
      }
    },
    [lockStoreRegistry],
  );

  const goLive = useCallback<LockContextValue['goLive']>(
    async (appKey) => {
      const typedAppKey = appKey as AppKey;
      if (subscriptionsRef.current.has(typedAppKey)) {
        return;
      }

      subscriptionsRef.current.set(
        typedAppKey,
        transport.subscribeToMessages({
          appKey: typedAppKey,
          listener: (message) => handleMessage(typedAppKey, message as LockTransportMessage),
        }),
      );
    },
    [handleMessage, transport],
  );

  const stopLive = useCallback<LockContextValue['stopLive']>(async (appKey) => {
    const typedAppKey = appKey as AppKey;
    subscriptionsRef.current.get(typedAppKey)?.unsubscribe();
    subscriptionsRef.current.delete(typedAppKey);
  }, []);

  const contextValue = useMemo<LockContextValue>(
    () => ({ goLive, stopLive }),
    [goLive, stopLive],
  );

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((subscription) => subscription.unsubscribe());
      subscriptionsRef.current.clear();
    };
  }, []);

  return <LockContext.Provider value={contextValue}>{children}</LockContext.Provider>;
}
