// src/transport/types.ts

import type { AppDefinition, AppKey, AppsDefinition } from "@/apps";

export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "submitted"
  | "failed"
  | "cancelled"
  | "paused"
  | "interrupted";

export interface Task<TArgs = unknown, TReturn = unknown> {
  id: string;
  appKey?: AppKey;
  action: string;
  args: TArgs;
  reference: string;
  status: TaskStatus;
  result?: TReturn;
  error?: string;
  progress?: number;
  progressMessage?: string;
  notify?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Policy for how an assignment should be handled */
export interface AssignPolicy {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Priority level */
  priority?: number;
}

/** Hook input for assignment */
export interface HookInput {
  /** Hook kind/type */
  kind: string;
  /** Hook hash identifier */
  hash: string;
}

/**
 * Full assign input matching the backend AssignInput model.
 * All fields except args are optional with sensible defaults.
 */
export interface AssignInput<TArgs = unknown> {
  /** The arguments for the action */
  args: TArgs;
  /** The policy for the assignation */
  policy?: AssignPolicy;
  /** Instance ID (required by backend, will be set by transport) */
  instanceId?: string;
  /** Action identifier */
  action?: string;
  /** Dependency identifier */
  dependency?: string;
  /** Resolution identifier */
  resolution?: string;
  /** Implementation identifier */
  implementation?: string;
  /** Agent identifier */
  agent?: string;
  /** Action hash */
  actionHash?: string;
  /** Method name */
  method?: string;
  /** Reservation identifier */
  reservation?: string;
  /** Interface name */
  interface?: string;
  /** Hooks to attach to this assignment */
  hooks?: HookInput[];
  /** Reference string */
  reference?: string;
  /** Parent task ID */
  parent?: string;
  /** Whether to use cached results */
  cached?: boolean;
  /** Whether to log this assignment */
  log?: boolean;
  /** Whether to capture output */
  capture?: boolean;
  /** Whether this is an ephemeral assignment */
  ephemeral?: boolean;
  /** Dependencies args */
  dependencies?: Record<string, unknown>;
  /** Whether this is a hook assignment */
  isHook?: boolean;
  /** Whether to step through execution */
  step?: boolean;
}

/** Options passed from the hook to customize assignment */
export interface AssignOptions {
  /** Show a toast notification when the task completes */
  notify?: boolean;
  /** The policy for the assignation */
  policy?: AssignPolicy;
  /** Agent identifier */
  agent?: string;
  /** Reservation identifier */
  reservation?: string;
  /** Reference string */
  reference?: string;
  /** Parent task ID */
  parent?: string;
  /** Whether to use cached results */
  cached?: boolean;
  /** Whether to log this assignment */
  log?: boolean;
  /** Whether to capture output */
  capture?: boolean;
  /** Whether this is an ephemeral assignment */
  ephemeral?: boolean;
  /** Hooks to attach to this assignment */
  hooks?: HookInput[];
  /** Whether to step through execution */
  step?: boolean;
}

export interface TaskUpdate {
  task_id: string;
  status?: TaskStatus;
  result?: unknown;
  error?: string;
  progress?: number;
}

export interface AssignResponse {
  task_id: string;
  status: TaskStatus;
}

// Log levels from the backend
export type LogLevel = "DEBUG" | "INFO" | "ERROR" | "WARN" | "CRITICAL";

// Task channel message types sent FROM the agent (backend) TO the frontend
export const TaskEventType = {
  REGISTER: "REGISTER",
  LOG: "LOG",
  PROGRESS: "PROGRESS",
  DONE: "DONE",
  YIELD: "YIELD",
  ERROR: "ERROR",
  PAUSED: "PAUSED",
  CRITICAL: "CRITICAL",
  STEPPED: "STEPPED",
  RESUMED: "RESUMED",
  CANCELLED: "CANCELLED",
  APP_CANCELLED: "APP_CANCELLED",
  ASSIGNED: "ASSIGNED",
  INTERRUPTED: "INTERRUPTED",
  HEARTBEAT_ANSWER: "HEARTBEAT_ANSWER",
} as const;

export type TaskEventType =
  (typeof TaskEventType)[keyof typeof TaskEventType];

export const StateEventType = {
  STATE_UPDATE: "STATE_UPDATE",
  STATE_PATCH: "STATE_PATCH",
} as const;

export type StateEventType =
  (typeof StateEventType)[keyof typeof StateEventType];

export const LockEventType = {
  LOCK: "LOCK",
  UNLOCK: "UNLOCK",
} as const;

export type LockEventType =
  (typeof LockEventType)[keyof typeof LockEventType];

// Backwards-compatible alias for task-channel event types.
export const FromAgentMessageType = TaskEventType;
export type FromAgentMessageType = TaskEventType;

// Message types sent TO the agent (backend) FROM the frontend
export const ToAgentMessageType = {
  ASSIGN: "ASSIGN",
  CANCEL: "CANCEL",
  STEP: "STEP",
  COLLECT: "COLLECT",
  RESUME: "RESUME",
  PAUSE: "PAUSE",
  INTERRUPT: "INTERRUPT",
  PROVIDE: "PROVIDE",
  UNPROVIDE: "UNPROVIDE",
  INIT: "INIT",
  HEARTBEAT: "HEARTBEAT",
  BOUNCE: "BOUNCE",
  KICK: "KICK",
  PROTOCOL_ERROR: "PROTOCOL_ERROR",
  LISTEN_STATES: "LISTEN_STATES",
  LISTEN_LOCKS: "LISTEN_LOCKS",
  LISTEN_TASKS: "LISTEN_TASKS",
} as const;

export type ToAgentMessageType =
  (typeof ToAgentMessageType)[keyof typeof ToAgentMessageType];

// Base message interface
export interface BaseMessage {
  id: string;
  type: string;
}

// FROM Agent Messages (received via WebSocket)

export interface LogEvent extends BaseMessage {
  type: typeof TaskEventType.LOG;
  assignation: string;
  message: string;
  level: LogLevel;
}

export interface ProgressEvent extends BaseMessage {
  type: typeof TaskEventType.PROGRESS;
  assignation: string;
  progress?: number;
  message?: string;
}

export interface YieldEvent extends BaseMessage {
  type: typeof TaskEventType.YIELD;
  assignation: string;
  returns?: Record<string, unknown>;
}

export interface DoneEvent extends BaseMessage {
  type: typeof TaskEventType.DONE;
  assignation: string;
  returns?: Record<string, unknown>;
}

export interface ErrorEvent extends BaseMessage {
  type: typeof TaskEventType.ERROR;
  assignation: string;
  error: string;
}

export interface CriticalEvent extends BaseMessage {
  type: typeof TaskEventType.CRITICAL;
  assignation: string;
  error: string;
}

export interface PausedEvent extends BaseMessage {
  type: typeof TaskEventType.PAUSED;
  assignation: string;
}

export interface ResumedEvent extends BaseMessage {
  type: typeof TaskEventType.RESUMED;
  assignation: string;
}

export interface SteppedEvent extends BaseMessage {
  type: typeof TaskEventType.STEPPED;
}

export interface CancelledEvent extends BaseMessage {
  type: typeof TaskEventType.CANCELLED;
  assignation: string;
}

export interface InterruptedEvent extends BaseMessage {
  type: typeof TaskEventType.INTERRUPTED;
  assignation: string;
}

export interface HeartbeatAnswerEvent extends BaseMessage {
  type: typeof TaskEventType.HEARTBEAT_ANSWER;
}

export interface RegisterMessage extends BaseMessage {
  type: typeof TaskEventType.REGISTER;
  instance_id: string;
  token: string;
}

export interface StateUpdateEvent {
  type: typeof StateEventType.STATE_UPDATE;
  state: string;
  value: unknown;
}

export interface EnvelopPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  old_value?: string;
}

export interface Envelope {
  state_name: string;
  rev: number;
  base_rev: number;
  ts: number;
  patches: EnvelopPatch[];
}

export interface StatePatchEvent {
  type: typeof StateEventType.STATE_PATCH;
  envelope: Envelope;
}

export interface LockEvent {
  type: typeof LockEventType.LOCK;
  key: string;
  assignation: string;
}

export interface UnlockEvent {
  type: typeof LockEventType.UNLOCK;
  key: string;
}

export type TaskEvent =
  | LogEvent
  | ProgressEvent
  | YieldEvent
  | DoneEvent
  | ErrorEvent
  | CriticalEvent
  | PausedEvent
  | ResumedEvent
  | SteppedEvent
  | CancelledEvent
  | LockEvent
  | UnlockEvent
  | InterruptedEvent
  | HeartbeatAnswerEvent
  | RegisterMessage;

export type StateEvent = StateUpdateEvent | StatePatchEvent;
export type LockEventMessage = LockEvent | UnlockEvent;

// Union type for all messages from the agent
export type FromAgentMessage =
  | TaskEvent
  | StateEvent
  | LockEventMessage
  | StateUpdateEvent
  | StatePatchEvent;

// TO Agent Messages (sent via WebSocket)

export interface AssignMessage extends BaseMessage {
  type: typeof ToAgentMessageType.ASSIGN;
  interface: string;
  extension: string;
  reservation?: string;
  assignation: string;
  root?: string;
  parent?: string;
  resolution?: string;
  capture: boolean;
  reference?: string;
  args: Record<string, unknown>;
  message?: string;
  user: string;
  org?: string;
  app: string;
  action: string;
}

export interface CancelMessage extends BaseMessage {
  type: typeof ToAgentMessageType.CANCEL;
  assignation: string;
}

export interface PauseMessage extends BaseMessage {
  type: typeof ToAgentMessageType.PAUSE;
  assignation: string;
}

export interface ResumeMessage extends BaseMessage {
  type: typeof ToAgentMessageType.RESUME;
  assignation: string;
}

export interface InterruptMessage extends BaseMessage {
  type: typeof ToAgentMessageType.INTERRUPT;
  assignation: string;
}

export interface StepMessage extends BaseMessage {
  type: typeof ToAgentMessageType.STEP;
  assignation: string;
}

export interface CollectMessage extends BaseMessage {
  type: typeof ToAgentMessageType.COLLECT;
  drawers: string[];
}

export interface HeartbeatMessage extends BaseMessage {
  type: typeof ToAgentMessageType.HEARTBEAT;
}

export interface AssignInquiry {
  assignation: string;
}

export interface InitMessage extends BaseMessage {
  type: typeof ToAgentMessageType.INIT;
  instance_id: string;
  agent: string;
  inquiries: AssignInquiry[];
}

export interface BounceMessage extends BaseMessage {
  type: typeof ToAgentMessageType.BOUNCE;
  duration?: number;
}

export interface KickMessage extends BaseMessage {
  type: typeof ToAgentMessageType.KICK;
  reason?: string;
}

export interface ProtocolErrorMessage extends BaseMessage {
  type: typeof ToAgentMessageType.PROTOCOL_ERROR;
  error: string;
}

export interface ListenStatesMessage {
  type: typeof ToAgentMessageType.LISTEN_STATES;
  states: string[];
}

export interface ListenLocksMessage {
  type: typeof ToAgentMessageType.LISTEN_LOCKS;
  locks: string[];
}

export interface ListenTasksMessage {
  type: typeof ToAgentMessageType.LISTEN_TASKS;
  tasks: string[];
}

export type TransportSubscriptionTopic = 'states' | 'locks' | 'tasks';

export type StateTransportMessage = StateEvent;
export type LockTransportMessage = LockEventMessage;
export type TaskTransportMessage = TaskEvent;

export interface TransportTopicMessageMap {
  states: StateTransportMessage;
  locks: LockTransportMessage;
  tasks: TaskTransportMessage;
}

export interface TransportSocketConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  isUnconnectable: boolean;
  reconnectAttempt: number;
}

export interface TransportMessageSubscription {
  unsubscribe: () => void;
}

// Union type for all messages to the agent
export type ToAgentMessage =
  | AssignMessage
  | CancelMessage
  | PauseMessage
  | ResumeMessage
  | InterruptMessage
  | StepMessage
  | CollectMessage
  | HeartbeatMessage
  | InitMessage
  | BounceMessage
  | KickMessage
  | ProtocolErrorMessage
  | ListenStatesMessage
  | ListenLocksMessage
  | ListenTasksMessage;


export type SessionBoundaries = {
  sessionStart: Date;
  sessionEnd: Date;
  startRevision: number;
  endRevision: number;
  sessionId: string;
};

// WebSocket message is now the FromAgentMessage
export type WebSocketMessage = FromAgentMessage;

export interface TransportConfig {
  /** Base API endpoint (e.g., "http://localhost:8000") */
  apiEndpoint: string;
  /** WebSocket endpoint (optional, defaults to ws version of apiEndpoint + /ws) */
  wsEndpoint?: string;
  /** Instance ID for this client (required for assignments) */
  instanceId: string;
  /** Reconnect settings */
  reconnect?: {
    /** Maximum number of reconnect attempts (default: Infinity) */
    maxAttempts?: number;
    /** Initial delay in ms (default: 1000) */
    initialDelay?: number;
    /** Maximum delay in ms (default: 30000) */
    maxDelay?: number;
    /** Backoff multiplier (default: 2) */
    backoffMultiplier?: number;
  };
  /** Ping interval in ms to keep connection alive (default: 30000) */
  pingInterval?: number;
  /** Optional app-specific endpoint overrides */
  appEndpoints?: Partial<
    Record<
      string,
      {
        apiEndpoint: string;
        wsEndpoint?: string;
      }
    >
  >;
}

export interface TransportContextValue {
  /** The API endpoint URL */
  apiEndpoint: string;
  /** Registered apps */
  apps: AppsDefinition;
  /** Default app key for unscoped definitions */
  defaultAppKey: AppKey;
  /** Default application-level generated definitions */
  app: AppDefinition;
  /** The resolved WebSocket endpoint URL */
  wsUrl: string;
  /** Instance ID used for assignment requests */
  instanceId: string;
  /** Ping interval for the websocket manager */
  pingInterval: number;
  /** Reconnect settings for the websocket manager */
  reconnect: Required<NonNullable<TransportConfig["reconnect"]>>;
  /** Submit an action assign request */
  assignAction: <TArgs>(
    appKey: AppKey,
    actionName: string,
    args: TArgs,
    options?: AssignOptions,
  ) => Promise<AssignResponse>;
  /** Get current state of a task by ID (fetches from server) */
  fetchTask: <TArgs = unknown, TReturn = unknown>(
    appKey: AppKey,
    taskId: string,
  ) => Promise<Task<TArgs, TReturn>>;
  /** Cancel a task */
  fetchSessionBoundaries: (
    appKey: AppKey,
    sessionId: string,
  ) => Promise<SessionBoundaries>;
  fetchActiveSessionBoundaries: (appKey: AppKey) => Promise<SessionBoundaries>;
  cancelTaskRequest: (appKey: AppKey, taskId: string) => Promise<void>;
  pauseTaskRequest: (appKey: AppKey, taskId: string) => Promise<void>;
  unpauseTaskRequest: (appKey: AppKey, taskId: string) => Promise<void>;
  stepTaskRequest: (appKey: AppKey, taskId: string) => Promise<void>;
  /** Fetch a state from the server */
  fetchState: <T = unknown>(appKey: AppKey, stateName: string) => Promise<T>;
  /** Fetch all active locks from the server */
  fetchLocks: (appKey: AppKey) => Promise<Record<string, { task_id: string }>>;
  /** Resolve an app definition for the given key */
  getApp: (appKey: AppKey) => AppDefinition;
  /** Resolve API and websocket endpoints for the given app */
  getEndpoints: (appKey: AppKey) => {
    apiEndpoint: string;
    wsUrl: string;
    stateWsUrl: string;
    lockWsUrl: string;
    taskWsUrl: string;
  };
  subscribeToMessages: <TTopic extends TransportSubscriptionTopic>(options: {
    appKey: AppKey;
    topic: TTopic;
    listener: (message: TransportTopicMessageMap[TTopic]) => void;
  }) => TransportMessageSubscription;
  subscribeToConnectionState: (
    appKey: AppKey,
    listener: (state: TransportSocketConnectionState) => void,
  ) => () => void;
  reconnectSocket: (appKey?: AppKey) => void;
  disconnectSocket: (appKey?: AppKey) => void;
}

export interface ActionContextValue {
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether the action layer is attempting to reconnect */
  isReconnecting: boolean;
  /** Current reconnect attempt number */
  reconnectAttempt: number;
  /** The API endpoint URL */
  apiEndpoint: string;
  /** All tracked tasks */
  tasks: Map<string, Task>;
  /** Create a stable local reference for a new task lifecycle */
  createReference: () => string;
  /** Assign an action with args, returns the contextual task */
  assign: <TArgs, TReturn>(
    appKey: AppKey,
    actionName: string,
    args: TArgs,
    options?: AssignOptions,
  ) => Promise<Task<TArgs, TReturn>>;
  /** Get current state of a task by ID (fetches from server) */
  getTask: <TArgs = unknown, TReturn = unknown>(
    appKey: AppKey,
    taskId: string,
  ) => Promise<Task<TArgs, TReturn>>;
  /** Get a task from local cache */
  getCachedTask: (taskId: string, appKey?: AppKey) => Task | undefined;
  /** Cancel a task */
  cancelTask: (appKey: AppKey, taskId: string) => Promise<void>;
  pauseTask: (appKey: AppKey, taskId: string) => Promise<void>;
  unpauseTask: (appKey: AppKey, taskId: string) => Promise<void>;
  stepTask: (appKey: AppKey, taskId: string) => Promise<void>;
  /** Subscribe to updates for a specific task */
  subscribeToTask: (
    taskId: string,
    appKey: AppKey,
    callback: (task: Task) => void,
  ) => () => void;
  /** Wait until a tracked task reaches a terminal state */
  waitForTask: <TArgs = unknown, TReturn = unknown>(
    appKey: AppKey,
    taskId: string,
  ) => Promise<Task<TArgs, TReturn>>;
  /** Manually reconnect the WebSocket */
  reconnect: () => void;
  /** Disconnect the WebSocket */
  disconnect: () => void;
}
