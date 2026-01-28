// src/transport/types.ts

export type TaskStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled'
  | 'paused'
  | 'interrupted';

export interface Task<TArgs = unknown, TReturn = unknown> {
  id: string;
  action: string;
  args: TArgs;
  status: TaskStatus;
  result?: TReturn;
  error?: string;
  progress?: number;
  progressMessage?: string;
  notify?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignOptions {
  /** Show a toast notification when the task completes */
  notify?: boolean;
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
export type LogLevel = 'DEBUG' | 'INFO' | 'ERROR' | 'WARN' | 'CRITICAL';

// Message types sent FROM the agent (backend) TO the frontend
export const FromAgentMessageType = {
  REGISTER: 'REGISTER',
  LOG: 'LOG',
  PROGRESS: 'PROGRESS',
  DONE: 'DONE',
  YIELD: 'YIELD',
  ERROR: 'ERROR',
  PAUSED: 'PAUSED',
  CRITICAL: 'CRITICAL',
  STEPPED: 'STEPPED',
  RESUMED: 'RESUMED',
  CANCELLED: 'CANCELLED',
  APP_CANCELLED: 'APP_CANCELLED',
  ASSIGNED: 'ASSIGNED',
  INTERRUPTED: 'INTERRUPTED',
  HEARTBEAT_ANSWER: 'HEARTBEAT_ANSWER',
  STATE_UPDATE: 'STATE_UPDATE',
  STATE_PATCH: 'STATE_PATCH',
} as const;

export type FromAgentMessageType = typeof FromAgentMessageType[keyof typeof FromAgentMessageType];

// Message types sent TO the agent (backend) FROM the frontend
export const ToAgentMessageType = {
  ASSIGN: 'ASSIGN',
  CANCEL: 'CANCEL',
  STEP: 'STEP',
  COLLECT: 'COLLECT',
  RESUME: 'RESUME',
  PAUSE: 'PAUSE',
  INTERRUPT: 'INTERRUPT',
  PROVIDE: 'PROVIDE',
  UNPROVIDE: 'UNPROVIDE',
  INIT: 'INIT',
  HEARTBEAT: 'HEARTBEAT',
  BOUNCE: 'BOUNCE',
  KICK: 'KICK',
  PROTOCOL_ERROR: 'PROTOCOL_ERROR',
} as const;

export type ToAgentMessageType = typeof ToAgentMessageType[keyof typeof ToAgentMessageType];

// Base message interface
export interface BaseMessage {
  id: string;
  type: FromAgentMessageType | ToAgentMessageType;
}

// FROM Agent Messages (received via WebSocket)

export interface LogEvent extends BaseMessage {
  type: typeof FromAgentMessageType.LOG;
  assignation: string;
  message: string;
  level: LogLevel;
}

export interface ProgressEvent extends BaseMessage {
  type: typeof FromAgentMessageType.PROGRESS;
  assignation: string;
  progress?: number;
  message?: string;
}

export interface YieldEvent extends BaseMessage {
  type: typeof FromAgentMessageType.YIELD;
  assignation: string;
  returns?: Record<string, unknown>;
}

export interface DoneEvent extends BaseMessage {
  type: typeof FromAgentMessageType.DONE;
  assignation: string;
}

export interface ErrorEvent extends BaseMessage {
  type: typeof FromAgentMessageType.ERROR;
  assignation: string;
  error: string;
}

export interface CriticalEvent extends BaseMessage {
  type: typeof FromAgentMessageType.CRITICAL;
  assignation: string;
  error: string;
}

export interface PausedEvent extends BaseMessage {
  type: typeof FromAgentMessageType.PAUSED;
  assignation: string;
}

export interface ResumedEvent extends BaseMessage {
  type: typeof FromAgentMessageType.RESUMED;
  assignation: string;
}

export interface SteppedEvent extends BaseMessage {
  type: typeof FromAgentMessageType.STEPPED;
}

export interface CancelledEvent extends BaseMessage {
  type: typeof FromAgentMessageType.CANCELLED;
  assignation: string;
}

export interface InterruptedEvent extends BaseMessage {
  type: typeof FromAgentMessageType.INTERRUPTED;
  assignation: string;
}

export interface HeartbeatAnswerEvent extends BaseMessage {
  type: typeof FromAgentMessageType.HEARTBEAT_ANSWER;
}

export interface RegisterMessage extends BaseMessage {
  type: typeof FromAgentMessageType.REGISTER;
  instance_id: string;
  token: string;
}

export interface StateUpdateEvent {
  type: typeof FromAgentMessageType.STATE_UPDATE;
  state: string;
  value: unknown;
}

export interface StatePatchEvent {
  type: typeof FromAgentMessageType.STATE_PATCH;
  interface: string;
  patch: string; // JSON string of patch operations
}

// Union type for all messages from the agent
export type FromAgentMessage =
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
  | InterruptedEvent
  | HeartbeatAnswerEvent
  | RegisterMessage
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
  | ProtocolErrorMessage;

// WebSocket message is now the FromAgentMessage
export type WebSocketMessage = FromAgentMessage;

export interface TransportConfig {
  /** Base API endpoint (e.g., "http://localhost:8000") */
  apiEndpoint: string;
  /** WebSocket endpoint (optional, defaults to ws version of apiEndpoint + /ws) */
  wsEndpoint?: string;
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
}

export interface TransportContextValue {
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether the transport is attempting to reconnect */
  isReconnecting: boolean;
  /** Current reconnect attempt number */
  reconnectAttempt: number;
  /** All tracked tasks */
  tasks: Map<string, Task>;
  /** All cached states */
  states: Map<string, unknown>;
  /** Assign an action with args, returns task_id */
  assign: <TArgs, TReturn>(
    actionName: string,
    args: TArgs,
    options?: AssignOptions
  ) => Promise<Task<TArgs, TReturn>>;
  /** Get current state of a task by ID (fetches from server) */
  getTask: <TArgs = unknown, TReturn = unknown>(
    taskId: string
  ) => Promise<Task<TArgs, TReturn>>;
  /** Get a task from local cache */
  getCachedTask: <TArgs = unknown, TReturn = unknown>(
    taskId: string
  ) => Task<TArgs, TReturn> | undefined;
  /** Cancel a task */
  cancelTask: (taskId: string) => Promise<void>;
  /** Subscribe to updates for a specific task */
  subscribeToTask: (
    taskId: string,
    callback: (task: Task) => void
  ) => () => void;
  /** Fetch a state from the server */
  fetchState: <T = unknown>(stateName: string) => Promise<T>;
  /** Get a state from local cache */
  getCachedState: <T = unknown>(stateName: string) => T | undefined;
  /** Subscribe to updates for a specific state */
  subscribeToState: <T = unknown>(
    stateName: string,
    callback: (value: T) => void
  ) => () => void;
  /** Manually reconnect the WebSocket */
  reconnect: () => void;
  /** Disconnect the WebSocket */
  disconnect: () => void;
}
