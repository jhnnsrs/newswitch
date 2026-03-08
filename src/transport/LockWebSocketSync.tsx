import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { AppKey } from "@/apps";
import { useLockStoreRegistry } from "@/lib/rekuest/locks/store";
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
  const lockStoreRegistry = useLockStoreRegistry();
  const channelManagerRef = useRef<
    Map<AppKey, SubscriptionWebSocketManager<LockChannelMessage>>
  >(new Map());
  const appKeys = useMemo(
    () => Object.keys(transport.apps) as AppKey[],
    [transport.apps],
  );

  useEffect(() => {
    const managers = new Map<AppKey, SubscriptionWebSocketManager<LockChannelMessage>>();

    for (const appKey of appKeys) {
      const app = transport.getApp(appKey);
      const endpoints = transport.getEndpoints(appKey);
      const listeningKeys = Object.values(app.locks).map((definition) => definition.key);

      const manager = new SubscriptionWebSocketManager<LockChannelMessage>({
        name: `LockWebSocketSync:${appKey}`,
        wsUrl: endpoints.lockWsUrl,
        pingInterval: transport.pingInterval,
        reconnect: transport.reconnect,
        buildListenMessage: (keys): ListenLocksMessage => ({
          type: "LISTEN_LOCKS",
          locks: keys,
        }),
        onMessage: (message) => {
          const store = lockStoreRegistry.getStoreApi(appKey).getState();

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
  }, [appKeys, lockStoreRegistry, managerRef, transport]);

  return null;
}