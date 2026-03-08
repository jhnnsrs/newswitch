import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { Envelope as StateStoreEnvelope } from "../store/stateStore";
import { useGlobalStateStoreApi } from "../store";
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
  const globalStateStoreApi = useGlobalStateStoreApi();
  const channelManagerRef = useRef<SubscriptionWebSocketManager<StateChannelMessage> | null>(null);
  const listeningKeys = useMemo(
    () => Object.values(transport.app.states).map((definition) => definition.key),
    [transport.app.states],
  );

  useEffect(() => {
    const manager = new SubscriptionWebSocketManager<StateChannelMessage>({
      name: "StateWebSocketSync",
      wsUrl: transport.stateWsUrl,
      pingInterval: transport.pingInterval,
      reconnect: transport.reconnect,
      buildListenMessage: (keys): ListenStatesMessage => ({
        type: "LISTEN_STATES",
        states: keys,
      }),
      onMessage: (message) => {
        const store = globalStateStoreApi.getState();

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
    channelManagerRef.current = manager;

    if (managerRef) {
      managerRef.current = {
        reconnect: () => manager.reconnect(),
        disconnect: () => manager.disconnect(),
      };
    }

    return () => {
      manager.disconnect();
      channelManagerRef.current = null;
      if (managerRef) {
        managerRef.current = null;
      }
    };
  }, [globalStateStoreApi, listeningKeys, managerRef, transport]);

  return null;
}