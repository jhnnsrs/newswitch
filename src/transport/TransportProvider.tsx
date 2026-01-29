// src/transport/TransportProvider.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import type { Operation } from 'fast-json-patch';
import {
  FromAgentMessageType,
  type TransportConfig,
  type TransportContextValue,
  type Task,
  type TaskStatus,
  type FromAgentMessage,
  type AssignResponse,
  type AssignOptions,
} from './types';
import { useGlobalStateStore } from '../store';

const TransportContext = createContext<TransportContextValue | null>(null);

const DEFAULT_RECONNECT_CONFIG = {
  maxAttempts: Infinity,
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
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [tasks, setTasks] = useState<Map<string, Task>>(new Map());

  // Get Zustand store actions
  const globalStateStore = useGlobalStateStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscribersRef = useRef<Map<string, Set<(task: Task) => void>>>(new Map());
  const shouldReconnectRef = useRef(true);
  const mountedRef = useRef(true);

  const reconnectConfig = useMemo(
    () => ({ ...DEFAULT_RECONNECT_CONFIG, ...config.reconnect }),
    [config.reconnect]
  );

  const pingInterval = config.pingInterval ?? DEFAULT_PING_INTERVAL;

  // Derive WebSocket URL from API endpoint
  const wsUrl = useMemo(() => {
    if (config.wsEndpoint) {
      return config.wsEndpoint;
    }
    const url = new URL(config.apiEndpoint);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = url.pathname.replace(/\/$/, '') + '/ws';
    return url.toString();
  }, [config.apiEndpoint, config.wsEndpoint]);

  // Update a task and notify subscribers
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) => {
      const existing = prevTasks.get(taskId);
      if (!existing) return prevTasks;

      const updated: Task = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      const newTasks = new Map(prevTasks);
      newTasks.set(taskId, updated);

      // Notify subscribers
      const subs = subscribersRef.current.get(taskId);
      if (subs) {
        subs.forEach((callback) => callback(updated));
      }

      return newTasks;
    });
  }, []);

  // Add a new task to the registry
  const addTask = useCallback(<TArgs, TReturn>(
    taskId: string,
    action: string,
    args: TArgs,
    status: TaskStatus = 'pending',
    options?: AssignOptions
  ): Task<TArgs, TReturn> => {
    const task: Task<TArgs, TReturn> = {
      id: taskId,
      action,
      args,
      status,
      notify: options?.notify,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks((prev) => {
      const newTasks = new Map(prev);
      newTasks.set(taskId, task as Task);
      return newTasks;
    });

    return task;
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
        console.log('[Transport] Message received:', event.data);
      const message: FromAgentMessage = JSON.parse(event.data);
        
      
      switch (message.type) {
        case FromAgentMessageType.PROGRESS: {
          updateTask(message.assignation, {
            status: 'running',
            progress: message.progress,
            progressMessage: message.message,
          });
          break;
        }

        case FromAgentMessageType.YIELD: {
          updateTask(message.assignation, {
            status: 'running',
            result: message.returns,
          });
          break;
        }

        case FromAgentMessageType.DONE: {
          // Check if task has notify enabled before updating
          toast(`Message received: ${message.type}`, { duration: 1000 });

          setTasks((prevTasks) => {
            const existing = prevTasks.get(message.assignation);
            if (existing?.notify) {
              toast.success(`Task completed: ${existing.action}`, {
                description: `Task ${message.assignation} finished successfully`,
              });
            }
            return prevTasks;
          });
          updateTask(message.assignation, {
            status: 'completed',
          });
          break;
        }

        case FromAgentMessageType.ERROR: {
          updateTask(message.assignation, {
            status: 'failed',
            error: message.error,
          });
          break;
        }

        case FromAgentMessageType.CRITICAL: {
          updateTask(message.assignation, {
            status: 'failed',
            error: message.error,
          });
          console.error('[Transport] Critical error:', message.error);
          break;
        }

        case FromAgentMessageType.PAUSED: {
          updateTask(message.assignation, {
            status: 'paused',
          });
          break;
        }

        case FromAgentMessageType.RESUMED: {
          updateTask(message.assignation, {
            status: 'running',
          });
          break;
        }

        case FromAgentMessageType.CANCELLED: {
          updateTask(message.assignation, {
            status: 'cancelled',
          });
          break;
        }

        case FromAgentMessageType.INTERRUPTED: {
          updateTask(message.assignation, {
            status: 'interrupted',
          });
          break;
        }

        case FromAgentMessageType.STEPPED: {
          // Stepped event doesn't have assignation in the model
          console.log('[Transport] Stepped event received');
          break;
        }

        case FromAgentMessageType.LOG: {
          // Handle log messages from the agent
          const logMethod = message.level === 'ERROR' || message.level === 'CRITICAL' 
            ? console.error 
            : message.level === 'WARN' 
              ? console.warn 
              : console.log;
          logMethod(`[Agent Log] [${message.level}] ${message.message}`);
          break;
        }

        case FromAgentMessageType.HEARTBEAT_ANSWER: {
          // Heartbeat response received
          break;
        }

        case FromAgentMessageType.REGISTER: {
          console.log('[Transport] Agent registered:', message.instance_id);
          break;
        }

        case FromAgentMessageType.STATE_UPDATE: {
          // Update state in Zustand store
          globalStateStore.setState(message.state, message.value);
          break;
        }

        case FromAgentMessageType.STATE_PATCH: {
          // Apply JSON patch to existing state using Zustand store
          const stateName = message.interface;
          const patchOperations: Operation[] = JSON.parse(message.patch);
          
          globalStateStore.applyJsonPatch(stateName, patchOperations);
          console.log(`[Transport] Applied patch to state ${stateName}`);
          break;
        }

        default: {
          // Type guard for exhaustiveness
          const _exhaustiveCheck: never = message;
          console.warn('[Transport] Unknown message type:', (_exhaustiveCheck as FromAgentMessage).type);
        }
      }
    } catch (error) {
      console.error('[Transport] Failed to parse message:', error);
    }
  }, [updateTask]);

  // Calculate reconnect delay with exponential backoff
  const getReconnectDelay = useCallback((attempt: number) => {
    const delay =
      reconnectConfig.initialDelay *
      Math.pow(reconnectConfig.backoffMultiplier, attempt);
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.min(delay + jitter, reconnectConfig.maxDelay);
  }, [reconnectConfig]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Cleanup existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('[Transport] WebSocket connected');
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempt(0);

        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, pingInterval);
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        console.log('[Transport] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnection if not intentionally disconnected
        if (shouldReconnectRef.current) {
          setIsReconnecting(true);
          setReconnectAttempt((prev) => {
            const nextAttempt = prev + 1;
            if (nextAttempt <= reconnectConfig.maxAttempts) {
              const delay = getReconnectDelay(prev);
              console.log(
                `[Transport] Reconnecting in ${Math.round(delay)}ms (attempt ${nextAttempt})`
              );
              reconnectTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current && shouldReconnectRef.current) {
                  connect();
                }
              }, delay);
            } else {
              console.error('[Transport] Max reconnection attempts reached');
              setIsReconnecting(false);
            }
            return nextAttempt;
          });
        }
      };

      ws.onerror = (error) => {
        console.error('[Transport] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[Transport] Failed to create WebSocket:', error);
    }
  }, [wsUrl, handleMessage, pingInterval, getReconnectDelay, reconnectConfig.maxAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsReconnecting(false);
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    setReconnectAttempt(0);
    disconnect();
    setTimeout(() => {
      shouldReconnectRef.current = true;
      connect();
    }, 100);
  }, [connect, disconnect]);

  // Assign an action (create a task)
  const assign = useCallback(async <TArgs, TReturn>(
    actionName: string,
    args: TArgs,
    options?: AssignOptions
  ): Promise<Task<TArgs, TReturn>> => {
    const url = `${config.apiEndpoint.replace(/\/$/, '')}/${actionName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to assign action: ${response.status} ${errorText}`);
    }

    const data: AssignResponse = await response.json();
    const task = addTask<TArgs, TReturn>(data.task_id, actionName, args, data.status, options);

    return task;
  }, [config.apiEndpoint, addTask]);

  // Get task from server
  const getTask = useCallback(async <TArgs = unknown, TReturn = unknown>(
    taskId: string
  ): Promise<Task<TArgs, TReturn>> => {
    const url = `${config.apiEndpoint.replace(/\/$/, '')}/tasks/${taskId}`;

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
      createdAt: new Date(data.created_at ?? data.createdAt),
      updatedAt: new Date(data.updated_at ?? data.updatedAt ?? Date.now()),
    };

    // Update local cache
    setTasks((prev) => {
      const newTasks = new Map(prev);
      newTasks.set(taskId, task as Task);
      return newTasks;
    });

    return task;
  }, [config.apiEndpoint]);

  // Get cached task
  const getCachedTask = useCallback(<TArgs = unknown, TReturn = unknown>(
    taskId: string
  ): Task<TArgs, TReturn> | undefined => {
    return tasks.get(taskId) as Task<TArgs, TReturn> | undefined;
  }, [tasks]);

  // Cancel a task
  const cancelTask = useCallback(async (taskId: string): Promise<void> => {
    const url = `${config.apiEndpoint.replace(/\/$/, '')}/tasks/${taskId}/cancel`;

    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to cancel task: ${response.status} ${errorText}`);
    }

    updateTask(taskId, { status: 'cancelled' });
  }, [config.apiEndpoint, updateTask]);

  // Subscribe to task updates
  const subscribeToTask = useCallback((
    taskId: string,
    callback: (task: Task) => void
  ): (() => void) => {
    if (!subscribersRef.current.has(taskId)) {
      subscribersRef.current.set(taskId, new Set());
    }
    subscribersRef.current.get(taskId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subs = subscribersRef.current.get(taskId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          subscribersRef.current.delete(taskId);
        }
      }
    };
  }, []);

  // Fetch state from server
  const fetchState = useCallback(async <T = unknown>(stateName: string): Promise<T> => {
    const url = `${config.apiEndpoint.replace(/\/$/, '')}/states/${stateName}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch state: ${response.status} ${errorText}`);
    }

    const data = await response.json() as T;

    // Update Zustand store
    globalStateStore.setState(stateName, data);

    return data;
  }, [config.apiEndpoint, globalStateStore]);

  // Get cached state from Zustand store
  const getCachedState = useCallback(<T = unknown>(stateName: string): T | undefined => {
    return globalStateStore.getState<T>(stateName);
  }, [globalStateStore]);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    shouldReconnectRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  const contextValue = useMemo<TransportContextValue>(
    () => ({
      isConnected,
      isReconnecting,
      reconnectAttempt,
      tasks,
      assign,
      getTask,
      getCachedTask,
      cancelTask,
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
      tasks,
      assign,
      getTask,
      getCachedTask,
      cancelTask,
      subscribeToTask,
      fetchState,
      getCachedState,
      reconnect,
      disconnect,
    ]
  );

  return (
    <TransportContext.Provider value={contextValue}>
      {children}
    </TransportContext.Provider>
  );
};

export const useTransport = (): TransportContextValue => {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
};

export default TransportProvider;
