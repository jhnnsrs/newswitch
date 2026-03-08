import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useLockStoreApi } from "../store";
import {
  FromAgentMessageType,
  type ListenLocksMessage,
  type LockEvent,
  type RegisterMessage,
  type UnlockEvent,
} from "./types";
import { SubscriptionWebSocketManager } from "./SubscriptionWebSocketManager";
import { useTransport } from "./transport-context";

type LockChannelMessage =
  | RegisterMessage
  | LockEvent
  | UnlockEvent
  | { type: typeof FromAgentMessageType.HEARTBEAT_ANSWER };

export interface LockWebSocketSyncHandle {
  reconnect: () => void;
  disconnect: () => void;
}

interface LockWebSocketSyncProps {
  managerRef?: MutableRefObject<LockWebSocketSyncHandle | null>;
}

export function LockWebSocketSync({ managerRef }: LockWebSocketSyncProps) {
  const transport = useTransport();
  const lockStoreApi = useLockStoreApi();
  const channelManagerRef = useRef<SubscriptionWebSocketManager<LockChannelMessage> | null>(null);
  const listeningKeys = useMemo(
    () => Object.values(transport.app.locks).map((definition) => definition.key),
    [transport.app.locks],
  );

  useEffect(() => {
    const manager = new SubscriptionWebSocketManager<LockChannelMessage>({
      name: "LockWebSocketSync",
      wsUrl: transport.lockWsUrl,
      pingInterval: transport.pingInterval,
      reconnect: transport.reconnect,
      buildListenMessage: (keys): ListenLocksMessage => ({
        type: "LISTEN_LOCKS",
        locks: keys,
      }),
      onMessage: (message) => {
        const store = lockStoreApi.getState();

        switch (message.type) {
          case FromAgentMessageType.LOCK:
            store.setLock(message.key, message.assignation);
            return;
          case FromAgentMessageType.UNLOCK:
            store.setLock(message.key, undefined);
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
  }, [listeningKeys, lockStoreApi, managerRef, transport]);

  return null;
}