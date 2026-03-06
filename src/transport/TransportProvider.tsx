// src/transport/TransportProvider.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  selectTask,
  useGlobalStateStore,
  useGlobalStateStoreApi,
  useTransportStore,
  useTransportStoreApi,
} from "../store";
import {
  type AssignInput,
  type AssignOptions,
  type AssignResponse,
  type Task,
  type TransportConfig,
} from "./types";
import type { TransportContextValue } from "./types";
import { WebSocketManager } from "./WebSocketManager";
import { TransportContext } from "./transport-context";

const DEFAULT_RECONNECT_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

const DEFAULT_PING_INTERVAL = 30000;

interface TransportProviderProps {
  children: React.ReactNode;
  config: TransportConfig;
}

export const TransportProvider: React.FC<TransportProviderProps> = ({
  children,
  config,
}) => {
  const globalStateStoreApi = useGlobalStateStoreApi();
  const transportStoreApi = useTransportStoreApi();
  const setGlobalState = useGlobalStateStore((s) => s.setState);

  // Subscribe only to primitives/maps needed for rendering to prevent re-rendering on every task update
  const isConnected = useTransportStore((s) => s.isConnected);
  const isReconnecting = useTransportStore((s) => s.isReconnecting);
  const isUnconnectable = useTransportStore((s) => s.isUnconnectable);
  const reconnectAttempt = useTransportStore((s) => s.reconnectAttempt);
  const tasks = useTransportStore((s) => s.tasks);

  // Pull actions from the store natively
  const addTask = useTransportStore((s) => s.addTask);
  const updateTask = useTransportStore((s) => s.updateTask);
  const getTaskFromStore = useTransportStore((s) => s.getTask);
  const setAssignationID = useTransportStore((s) => s.setAssignationID);

  const managerRef = useRef<WebSocketManager | null>(null);

  const reconnectConfig = useMemo(
    () => ({ ...DEFAULT_RECONNECT_CONFIG, ...config.reconnect }),
    [config.reconnect],
  );

  const pingInterval = config.pingInterval ?? DEFAULT_PING_INTERVAL;

  // Derive WebSocket URL from API endpoint
  const wsUrl = useMemo(() => {
    if (config.wsEndpoint) {
      return config.wsEndpoint;
    }
    const url = new URL(config.apiEndpoint);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = url.pathname.replace(/\/$/, "") + "/ws";
    return url.toString();
  }, [config.apiEndpoint, config.wsEndpoint]);

  // Initialize and manage WebSocket manager
  useEffect(() => {
    const manager = new WebSocketManager({
      wsUrl,
      pingInterval,
      reconnect: reconnectConfig,
      globalStateStore: globalStateStoreApi,
      transportStore: transportStoreApi,
    });

    managerRef.current = manager;
    manager.connect();

    return () => {
      manager.disconnect();
      managerRef.current = null;
    };
  }, [
    wsUrl,
    pingInterval,
    reconnectConfig,
    globalStateStoreApi,
    transportStoreApi,
  ]);

  // Fetch locks when connected
  useEffect(() => {
    if (!isConnected) return;

    const fetchLocks = async () => {
      try {
        const url = `${config.apiEndpoint.replace(/\/$/, "")}/locks`;
        const response = await fetch(url);

        if (!response.ok) {
          console.error(
            "[TransportProvider] Failed to fetch locks:",
            response.status,
          );
          return;
        }

        const locks: { locks: Record<string, { task_id: string }> } =
          await response.json();

        // Update global state store with all locks
        const globalState = globalStateStoreApi.getState();
        Object.entries(locks.locks).forEach(([key, lock]) => {
          console.log(
            `[TransportProvider] Setting lock ${key} to task ${lock.task_id}`,
          );
          globalState.setLock(key, lock.task_id);
        });

        console.log("[TransportProvider] Fetched locks:", locks);
      } catch (error) {
        console.error("[TransportProvider] Error fetching locks:", error);
      }
    };

    fetchLocks();
  }, [isConnected, config.apiEndpoint, globalStateStoreApi]);

  // Reconnect function
  const reconnect = useCallback(() => {
    managerRef.current?.reconnect();
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    managerRef.current?.disconnect();
  }, []);

  // Assign an action (create a task)
  const assign = useCallback(
    async <TArgs, TReturn>(
      actionName: string,
      args: TArgs,
      options?: AssignOptions,
    ): Promise<Task<TArgs, TReturn>> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/${actionName}`;

      // 1. Ensure a reference exists (either from options or generated)
      const reference =
        options?.reference ||
        `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      // 2. Add the task locally first so the UI can react immediately
      addTask(actionName, reference, args, "pending");

      const assignInput: AssignInput<TArgs> = {
        args,
        instanceId: config.instanceId,
        action: actionName,
        policy: options?.policy,
        agent: options?.agent,
        reservation: options?.reservation,
        reference: reference, // Pass the explicit reference to the server
        parent: options?.parent,
        cached: options?.cached ?? false,
        log: options?.log ?? true,
        capture: options?.capture ?? false,
        ephemeral: options?.ephemeral ?? false,
        hooks: options?.hooks,
        step: options?.step,
      };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assignInput),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to assign action: ${response.status} ${errorText}`,
          );
        }

        const data: AssignResponse = await response.json();

        // 3. Link the server's task ID back to our local reference
        setAssignationID(reference, data.task_id);

        // 4. Update the task with the status returned from the server
        updateTask(reference, { status: data.status });

        return getTaskFromStore<TArgs, TReturn>(reference)!;
      } catch (error: unknown) {
        // Clean up and mark as failed if the network request bombs out
        const message =
          error instanceof Error ? error.message : "Unknown transport error";
        updateTask(reference, { status: "failed", error: message });
        throw error;
      }
    },
    [
      config.apiEndpoint,
      config.instanceId,
      addTask,
      setAssignationID,
      updateTask,
      getTaskFromStore,
    ],
  );

  // Get task from server
  const getTask = useCallback(
    async <TArgs = unknown, TReturn = unknown>(
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/tasks/${taskId}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get task: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const task: Task<TArgs, TReturn> = {
        id: data.task_id ?? data.id,
        action: data.action,
        args: data.args,
        status: data.status,
        result: data.result,
        error: data.error,
        progress: data.progress,
        reference: data.reference, // Ensure we pull down the reference if the server sends it
        createdAt: new Date(data.created_at ?? data.createdAt),
        updatedAt: new Date(data.updated_at ?? data.updatedAt ?? Date.now()),
      };

      updateTask(taskId, task);

      return task;
    },
    [config.apiEndpoint, updateTask],
  );

  // Get cached task
  const getCachedTask = useCallback(
    (taskId: string): Task | undefined => {
      return getTaskFromStore(taskId);
    },
    [getTaskFromStore],
  );

  const cancelTask = useCallback(
    async (taskId: string): Promise<void> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/cancel`;

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ assignation: taskId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to cancel task: ${response.status} ${errorText}`,
        );
      }

      updateTask(taskId, { status: "cancelled" });
    },
    [config.apiEndpoint, updateTask],
  );

  const unpauseTask = useCallback(
    async (taskId: string): Promise<void> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/resume`;

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ assignation: taskId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to unpause task: ${response.status} ${errorText}`,
        );
      }

      updateTask(taskId, { status: "running" });
    },
    [config.apiEndpoint, updateTask],
  );

  const stepTask = useCallback(
    async (taskId: string): Promise<void> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/step`;

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ assignation: taskId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to step task: ${response.status} ${errorText}`);
      }

      updateTask(taskId, { status: "running" });
    },
    [config.apiEndpoint, updateTask],
  );

  const pauseTask = useCallback(
    async (taskId: string): Promise<void> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/pause`;

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ assignation: taskId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to pause task: ${response.status} ${errorText}`,
        );
      }

      updateTask(taskId, { status: "paused" });
    },
    [config.apiEndpoint, updateTask],
  );

  // Subscribe to task updates using Zustand's native subscribe
  const subscribeToTask = useCallback(
    (taskId: string, callback: (task: Task) => void): (() => void) => {
      return transportStoreApi.subscribe(selectTask(taskId), (task) => {
        if (task) callback(task as Task);
      });
    },
    [transportStoreApi],
  );

  // Fetch state from server
  const fetchState = useCallback(
    async <T = unknown,>(stateName: string): Promise<T> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/states/${stateName}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch state: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as T;
      setGlobalState(stateName, data);

      return data;
    },
    [config.apiEndpoint, setGlobalState],
  );

  // Get cached state
  const getCachedState = useCallback(
    <T = unknown,>(stateName: string): T | undefined => {
      return globalStateStoreApi.getState().getState<T>(stateName);
    },
    [globalStateStoreApi],
  );

  // Convert tasks record to Map for backward compatibility
  const tasksMap = useMemo(() => {
    const map = new Map<string, Task>();
    for (const [id, task] of Object.entries(tasks)) {
      map.set(id, task);
    }
    return map;
  }, [tasks]);

  const contextValue = useMemo<TransportContextValue>(
    () => ({
      isConnected,
      isReconnecting,
      reconnectAttempt,
      apiEndpoint: config.apiEndpoint,
      tasks: tasksMap,
      assign,
      getTask,
      getCachedTask,
      unpauseTask,
      pauseTask,
      cancelTask,
      stepTask,
      subscribeToTask,
      fetchState,
      getCachedState,
      reconnect,
      disconnect,
    }),
    [
      isConnected,
      isReconnecting,
      reconnectAttempt,
      config.apiEndpoint,
      tasksMap,
      assign,
      getTask,
      getCachedTask,
      cancelTask,
      subscribeToTask,
      pauseTask,
      unpauseTask,
      stepTask,
      fetchState,
      getCachedState,
      reconnect,
      disconnect,
    ],
  );

  // Fallback UI for when connection fails after max retries
  if (isUnconnectable) {
    return (
      <TransportContext.Provider value={contextValue}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v2m0 4h.01"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Unable to Connect
              </h2>
              <p className="max-w-md text-muted-foreground">
                Could not establish a connection to the microscope server after{" "}
                {reconnectConfig.maxAttempts} attempts. Please check that the
                server is running and try again.
              </p>
            </div>
            <button
              onClick={reconnect}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry Connection
            </button>
          </div>
        </div>
      </TransportContext.Provider>
    );
  }

  // Loading UI while connecting
  if (!isConnected) {
    return (
      <TransportContext.Provider value={contextValue}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {isReconnecting ? "Reconnecting..." : "Connecting..."}
              </h2>
              <p className="max-w-md text-muted-foreground">
                {isReconnecting
                  ? `Attempt ${reconnectAttempt} of ${reconnectConfig.maxAttempts}`
                  : "Establishing connection to the microscope server..."}
              </p>
            </div>
          </div>
        </div>
      </TransportContext.Provider>
    );
  }

  return (
    <TransportContext.Provider value={contextValue}>
      {children}
    </TransportContext.Provider>
  );
};

export default TransportProvider;
