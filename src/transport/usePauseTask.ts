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
export const usePauseTask = (
  options: UseCancelTaskOptions = {}
): UseCancelTaskResults => {
  const transport = useTransport();

  // Unpause task
  const pause = useCallback(async (taskId: string): Promise<void> => {
    if (!taskId) return;
    await transport.pauseTask(taskId);
  }, [transport]);

  return pause;
};

export default usePauseTask;
