import { useEffect } from "react";
import type { MutableRefObject } from "react";
import {
  useGlobalStateStoreApi,
  useLockStoreApi,
  useTransportStore,
  useTransportStoreApi,
} from "../store";
import { useTransport } from "./transport-context";
import { WebSocketManager } from "./WebSocketManager";

interface TransportWebSocketSyncProps {
  managerRef: MutableRefObject<WebSocketManager | null>;
}

export function TransportWebSocketSync({
  managerRef,
}: TransportWebSocketSyncProps) {
  const transport = useTransport();
  const globalStateStoreApi = useGlobalStateStoreApi();
  const lockStoreApi = useLockStoreApi();
  const transportStoreApi = useTransportStoreApi();
  const isConnected = useTransportStore((s) => s.isConnected);

  useEffect(() => {
    const manager = new WebSocketManager({
      wsUrl: transport.wsUrl,
      pingInterval: transport.pingInterval,
      reconnect: transport.reconnect,
      globalStateStore: globalStateStoreApi,
      lockStore: lockStoreApi,
      transportStore: transportStoreApi,
    });

    managerRef.current = manager;
    manager.connect();

    return () => {
      manager.disconnect();
      managerRef.current = null;
    };
  }, [
    globalStateStoreApi,
    managerRef,
    transport.pingInterval,
    transport.reconnect,
    transport.wsUrl,
    lockStoreApi,
    transportStoreApi,
  ]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const syncLocks = async () => {
      try {
        const locks = await transport.fetchLocks();
        lockStoreApi.getState().replaceLocks(
          Object.fromEntries(
            Object.entries(locks).map(([key, lock]) => [key, lock.task_id]),
          ),
        );
      } catch (error) {
        console.error("[TransportWebSocketSync] Error fetching locks:", error);
      }
    };

    void syncLocks();
  }, [isConnected, lockStoreApi, transport]);

  return null;
}
