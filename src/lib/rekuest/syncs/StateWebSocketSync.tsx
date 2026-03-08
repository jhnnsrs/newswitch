import { useEffect, useRef } from "react";
import type { AppKey } from "@/lib/rekuest/types";
import type { Envelope as StateStoreEnvelope } from "@/lib/rekuest/state/store";
import { useGlobalStateStoreRegistry } from "@/lib/rekuest/state/store";
import {
  StateEventType,
  type StateTransportMessage,
  type TransportMessageSubscription,
} from "@/lib/rekuest/transport/types";
import { useTransport } from "../transport/transport-context";

export interface StateWebSocketSyncProps {
  appKey: AppKey;
}

export function StateWebSocketSync({ appKey }: StateWebSocketSyncProps) {
  const transport = useTransport();
  const globalStateStoreRegistry = useGlobalStateStoreRegistry();
  const subscriptionRef = useRef<TransportMessageSubscription | null>(null);

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

    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = transport.subscribeToMessages({
      appKey,
      topic: "states",
      listener: (message) => handleMessage(appKey, message),
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [appKey, globalStateStoreRegistry, transport]);

  return null;
}