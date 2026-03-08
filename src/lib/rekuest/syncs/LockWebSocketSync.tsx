import { useEffect, useMemo, useRef } from "react";
import type { AppKey } from "@/apps";
import { useLockStoreRegistry } from "@/lib/rekuest/locks/store";
import {
  LockEventType,
  type LockTransportMessage,
  type TransportMessageSubscription,
} from "../../../transport/types";
import { useTransport } from "../transport/transport-context";

export function LockWebSocketSync() {
  const transport = useTransport();
  const lockStoreRegistry = useLockStoreRegistry();
  const subscriptionsRef = useRef(new Map<AppKey, TransportMessageSubscription>());
  const appKeys = useMemo(
    () => Object.keys(transport.apps) as AppKey[],
    [transport.apps],
  );

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

    for (const appKey of appKeys) {
      const existingSubscription = subscriptionsRef.current.get(appKey);

      if (existingSubscription) {
        continue;
      }

      subscriptionsRef.current.set(
        appKey,
        transport.subscribeToMessages({
          appKey,
          topic: "locks",
          listener: (message) => handleMessage(appKey, message),
        }),
      );
    }

    subscriptionsRef.current.forEach((subscription, appKey) => {
      if (!appKeys.includes(appKey)) {
        subscription.unsubscribe();
        subscriptionsRef.current.delete(appKey);
      }
    });
  }, [appKeys, lockStoreRegistry, transport]);

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      subscriptions.clear();
    };
  }, []);

  return null;
}