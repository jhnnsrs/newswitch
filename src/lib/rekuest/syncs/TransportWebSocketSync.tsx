import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { LockWebSocketSync } from "./LockWebSocketSync";
import { StateWebSocketSync } from "./StateWebSocketSync";
import { TaskWebSocketSync } from "./TaskWebSocketSync";
import { useTransport } from "../transport/transport-context";

interface TransportWebSocketSyncProps {
  managerRef: MutableRefObject<TransportWebSocketSyncHandle | null>;
}

export interface TransportWebSocketSyncHandle {
  reconnect: () => void;
  disconnect: () => void;
}

export function TransportWebSocketSync({
  managerRef,
}: TransportWebSocketSyncProps) {
  const transport = useTransport();

  useEffect(() => {
    managerRef.current = {
      reconnect: () => {
        transport.reconnectSocket();
      },
      disconnect: () => {
        transport.disconnectSocket();
      },
    };

    return () => {
      managerRef.current = null;
    };
  }, [managerRef, transport]);

  return (
    <>
      <TaskWebSocketSync />
      <StateWebSocketSync />
      <LockWebSocketSync />
    </>
  );
}
