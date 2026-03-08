import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { AppKey } from "@/apps";
import type { Envelope as StateStoreEnvelope } from "@/lib/rekuest/state/store";
import { useGlobalStateStoreRegistry } from "@/lib/rekuest/state/store";
import {
  FromAgentMessageType,
  type ListenStatesMessage,
  type RegisterMessage,
  type StatePatchEvent,
  type StateUpdateEvent,
} from "./types";
import { SubscriptionWebSocketManager } from "./SubscriptionWebSocketManager";
import { useTransport } from "./transport-context";

type StateChannelMessage =
  | RegisterMessage
  | StateUpdateEvent
  | StatePatchEvent
  | { type: typeof FromAgentMessageType.HEARTBEAT_ANSWER };

export interface StateWebSocketSyncHandle {
  reconnect: () => void;
  disconnect: () => void;
}

interface StateWebSocketSyncProps {
  managerRef?: MutableRefObject<StateWebSocketSyncHandle | null>;
}

export function StateWebSocketSync({ managerRef }: StateWebSocketSyncProps) {
  const transport = useTransport();
  const globalStateStoreRegistry = useGlobalStateStoreRegistry();
  const channelManagerRef = useRef<
    Map<AppKey, SubscriptionWebSocketManager<StateChannelMessage>>
  >(new Map());
  const appKeys = useMemo(
    () => Object.keys(transport.apps) as AppKey[],
    [transport.apps],
  );

  useEffect(() => {
    const managers = new Map<AppKey, SubscriptionWebSocketManager<StateChannelMessage>>();

    for (const appKey of appKeys) {
      const app = transport.getApp(appKey);
      const endpoints = transport.getEndpoints(appKey);
      const listeningKeys = Object.values(app.states).map((definition) => definition.key);

      const manager = new SubscriptionWebSocketManager<StateChannelMessage>({
        name: `StateWebSocketSync:${appKey}`,
        wsUrl: endpoints.stateWsUrl,
        pingInterval: transport.pingInterval,
        reconnect: transport.reconnect,
        buildListenMessage: (keys): ListenStatesMessage => ({
          type: "LISTEN_STATES",
          states: keys,
        }),
        onMessage: (message) => {
          const store = globalStateStoreRegistry.getStoreApi(appKey).getState();

          switch (message.type) {
            case FromAgentMessageType.STATE_UPDATE:
              store.setState(message.state, message.value);
              return;
            case FromAgentMessageType.STATE_PATCH:
              store.applyEnvelope(message.envelope as unknown as StateStoreEnvelope);
              return;
            case FromAgentMessageType.REGISTER:
            case FromAgentMessageType.HEARTBEAT_ANSWER:
              return;
            default:
              return;
          }
        },
      });

      manager.updateListenKeys(listeningKeys);
      manager.connect();
      managers.set(appKey, manager);
    }

    channelManagerRef.current = managers;

    if (managerRef) {
      managerRef.current = {
        reconnect: () => {
          managers.forEach((manager) => manager.reconnect());
        },
        disconnect: () => {
          managers.forEach((manager) => manager.disconnect());
        },
      };
    }

    return () => {
      managers.forEach((manager) => manager.disconnect());
      channelManagerRef.current = new Map();
      if (managerRef) {
        managerRef.current = null;
      }
    };
  }, [appKeys, globalStateStoreRegistry, managerRef, transport]);

  return null;
}