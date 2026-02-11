// src/transport/useTask.ts

import { useCallback } from 'react';
import { useTransport } from './TransportProvider';

export interface UseCancelTaskOptions {
  /** Whether to fetch from server on mount */
  fetchOnMount?: boolean;
}

export type UseCancelTaskResults = (taskId: string) => Promise<void>;


/**
 * Hook to subscribe to a specific task by ID
 */
export const useCancelTask = (
  options: UseCancelTaskOptions = {}
): UseCancelTaskResults => {
  const transport = useTransport();

  // Cancel task
  const cancel = useCallback(async (taskId: string): Promise<void> => {
    if (!taskId) return;
    await transport.cancelTask(taskId);
  }, [transport]);

  return cancel
};

export default useCancelTask;
