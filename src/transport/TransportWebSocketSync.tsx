import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { LockWebSocketSync, type LockWebSocketSyncHandle } from "./LockWebSocketSync";
import { StateWebSocketSync, type StateWebSocketSyncHandle } from "./StateWebSocketSync";
import { TaskWebSocketSync, type TaskWebSocketSyncHandle } from "./TaskWebSocketSync";

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
  const taskManagerRef = useRef<TaskWebSocketSyncHandle | null>(null);
  const stateManagerRef = useRef<StateWebSocketSyncHandle | null>(null);
  const lockManagerRef = useRef<LockWebSocketSyncHandle | null>(null);

  useEffect(() => {
    managerRef.current = {
      reconnect: () => {
        taskManagerRef.current?.reconnect();
        stateManagerRef.current?.reconnect();
        lockManagerRef.current?.reconnect();
      },
      disconnect: () => {
        taskManagerRef.current?.disconnect();
        stateManagerRef.current?.disconnect();
        lockManagerRef.current?.disconnect();
      },
    };

    return () => {
      managerRef.current = null;
    };
  }, [managerRef]);

  return (
    <>
      <TaskWebSocketSync managerRef={taskManagerRef} />
      <StateWebSocketSync managerRef={stateManagerRef} />
      <LockWebSocketSync managerRef={lockManagerRef} />
    </>
  );
}
