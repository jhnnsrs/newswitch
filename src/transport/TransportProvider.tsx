import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { TransportContext } from "./transport-context";
import type {
  AssignInput,
  AssignOptions,
  AssignResponse,
  SessionBoundaries,
  Task,
  TransportConfig,
  TransportContextValue,
} from "./types";

const DEFAULT_RECONNECT_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
} as const;

const DEFAULT_PING_INTERVAL = 30000;

interface TransportProviderProps {
  children: ReactNode;
  config: TransportConfig;
}

function normalizeTask<TArgs = unknown, TReturn = unknown>(
  data: Record<string, unknown>,
): Task<TArgs, TReturn> {
  return {
    id: String(data.task_id ?? data.id),
    action: String(data.action ?? "unknown"),
    args: (data.args ?? {}) as TArgs,
    status: data.status as Task<TArgs, TReturn>["status"],
    result: data.result as TReturn | undefined,
    error: data.error as string | undefined,
    progress: data.progress as number | undefined,
    reference: String(data.reference ?? data.task_id ?? data.id),
    createdAt: new Date(String(data.created_at ?? data.createdAt ?? Date.now())),
    updatedAt: new Date(String(data.updated_at ?? data.updatedAt ?? Date.now())),
  };
}

export function TransportProvider({ children, config }: TransportProviderProps) {
  const reconnect = useMemo(
    () => ({ ...DEFAULT_RECONNECT_CONFIG, ...config.reconnect }),
    [config.reconnect],
  );

  const pingInterval = config.pingInterval ?? DEFAULT_PING_INTERVAL;

  const wsUrl = useMemo(() => {
    if (config.wsEndpoint) {
      return config.wsEndpoint;
    }

    const url = new URL(config.apiEndpoint);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = url.pathname.replace(/\/$/, "") + "/ws";
    return url.toString();
  }, [config.apiEndpoint, config.wsEndpoint]);

  const assignAction = useCallback(
    async <TArgs,>(
      actionName: string,
      args: TArgs,
      options?: AssignOptions,
    ): Promise<AssignResponse> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/${actionName}`;
      const assignInput: AssignInput<TArgs> = {
        args,
        instanceId: config.instanceId,
        action: actionName,
        policy: options?.policy,
        agent: options?.agent,
        reservation: options?.reservation,
        reference: options?.reference,
        parent: options?.parent,
        cached: options?.cached ?? false,
        log: options?.log ?? true,
        capture: options?.capture ?? false,
        ephemeral: options?.ephemeral ?? false,
        hooks: options?.hooks,
        step: options?.step,
      };

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

      return (await response.json()) as AssignResponse;
    },
    [config.apiEndpoint, config.instanceId],
  );

  const fetchTask = useCallback(
    async <TArgs = unknown, TReturn = unknown>(
      taskId: string,
    ): Promise<Task<TArgs, TReturn>> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/tasks/${taskId}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get task: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      return normalizeTask<TArgs, TReturn>(data);
    },
    [config.apiEndpoint],
  );

  const createTaskMutation = useCallback(
    (endpoint: string) => async (taskId: string) => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/${endpoint}`;
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ assignation: taskId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to ${endpoint} task: ${response.status} ${errorText}`,
        );
      }
    },
    [config.apiEndpoint],
  );

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

      return (await response.json()) as T;
    },
    [config.apiEndpoint],
  );


  const fetchActiveSessionBoundaries = useCallback(
    async (): Promise<SessionBoundaries> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/active_session_boundaries`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch session boundaries: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        session_id: string;
        start_revision: number;
        end_revision: number;
        start_time: string;
        end_time: string;

      };
      console.log("Fetched active session boundaries:", data); // Debug log

      return {
        sessionStart: new Date(data.start_time),
        sessionEnd: new Date(data.end_time),
        startRevision: data.start_revision,
        endRevision: data.end_revision,
        sessionId: data.session_id,

      };
    },
    [config.apiEndpoint],
  );

  const fetchSessionBoundaries = useCallback(
    async (sessionId: string): Promise<SessionBoundaries> => {
      const url = `${config.apiEndpoint.replace(/\/$/, "")}/session_boundaries/${sessionId}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch session boundaries: ${response.status} ${errorText}`,
        );
      }

      const data = (await response.json()) as {
        session_id: string;
        start_revision: number;
        end_revision: number;
        start_time: string;
        end_time: string;

      };

      return {
        sessionStart: new Date(data.start_time),
        sessionEnd: new Date(data.end_time),
        startRevision: data.start_revision,
        endRevision: data.end_revision,
        sessionId: data.session_id,

      };
    },
    [config.apiEndpoint],
  );

  const fetchLocks = useCallback(async () => {
    const url = `${config.apiEndpoint.replace(/\/$/, "")}/locks`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch locks: ${response.status} ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      locks: Record<string, { task_id: string }>;
    };

    return data.locks;
  }, [config.apiEndpoint]);

  const contextValue = useMemo<TransportContextValue>(
    () => ({
      apiEndpoint: config.apiEndpoint,
      assignAction,
      cancelTaskRequest: createTaskMutation("cancel"),
      fetchLocks,
      fetchState,
      fetchTask,
      instanceId: config.instanceId,
        fetchActiveSessionBoundaries,
        fetchSessionBoundaries,
      pauseTaskRequest: createTaskMutation("pause"),
      pingInterval,
      reconnect,
      stepTaskRequest: createTaskMutation("step"),
      unpauseTaskRequest: createTaskMutation("resume"),
      wsUrl,
    }),
    [
      assignAction,
      config.apiEndpoint,
      config.instanceId,
      createTaskMutation,
      fetchLocks,
      fetchState,
      fetchTask,
      fetchActiveSessionBoundaries,
      fetchSessionBoundaries,
      pingInterval,
      reconnect,
      wsUrl,
    ],
  );

  return (
    <TransportContext.Provider value={contextValue}>
      {children}
    </TransportContext.Provider>
  );
}

export default TransportProvider;
