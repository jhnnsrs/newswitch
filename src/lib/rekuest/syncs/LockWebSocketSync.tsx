import { useEffect, useRef } from "react";
import type { AppKey } from "@/lib/rekuest/types";
import { useLockStoreRegistry } from "@/lib/rekuest/locks/store";
import {
  LockEventType,
  type LockTransportMessage,
  type TransportMessageSubscription,
} from "@/lib/rekuest/transport/types";
import { useTransport } from "../transport/transport-context";

export interface LockWebSocketSyncProps {
  appKey: AppKey;
}

export function LockWebSocketSync({ appKey }: LockWebSocketSyncProps) {
  const transport = useTransport();
  const lockStoreRegistry = useLockStoreRegistry();
  const subscriptionRef = useRef<TransportMessageSubscription | null>(null);

  useEffect(() => {
    const handleMessage = (appKey: AppKey, message: LockTransportMessage) => {
      const store = lockStoreRegistry.getStoreApi(appKey).getState();

      switch (message.type) {
        case LockEventType.LOCK:
          store.setLock(message.key, message.assignation);
          return;
        case LockEventType.UNLOCK:
          store.setLock(message.key, undefined);
          return;
      }
    };

    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = transport.subscribeToMessages({
      appKey,
      topic: "locks",
      listener: (message) => handleMessage(appKey, message),
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [appKey, lockStoreRegistry, transport]);

  return null;
}