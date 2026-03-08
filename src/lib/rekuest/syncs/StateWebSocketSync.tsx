import { useEffect, useMemo, useRef } from "react";
import type { AppKey } from "@/apps";
import type { Envelope as StateStoreEnvelope } from "@/lib/rekuest/state/store";
import { useGlobalStateStoreRegistry } from "@/lib/rekuest/state/store";
import {
  StateEventType,
  type StateTransportMessage,
  type TransportMessageSubscription,
} from "@/lib/rekuest/transport/types";
import { useTransport } from "../transport/transport-context";

export function StateWebSocketSync() {
  const transport = useTransport();
  const globalStateStoreRegistry = useGlobalStateStoreRegistry();
  const subscriptionsRef = useRef(new Map<AppKey, TransportMessageSubscription>());
  const appKeys = useMemo(
    () => Object.keys(transport.apps) as AppKey[],
    [transport.apps],
  );

  useEffect(() => {
    const handleMessage = (appKey: AppKey, message: StateTransportMessage) => {
      const store = globalStateStoreRegistry.getStoreApi(appKey).getState();

      switch (message.type) {
        case StateEventType.STATE_UPDATE:
          store.setState(message.state, message.value);
          return;
        case StateEventType.STATE_PATCH:
          store.applyEnvelope(message.envelope as unknown as StateStoreEnvelope);
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
          topic: "states",
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
  }, [appKeys, globalStateStoreRegistry, transport]);

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      subscriptions.clear();
    };
  }, []);

  return null;
}