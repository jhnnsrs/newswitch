// src/transport/useTask.ts

import { useState, useEffect, useCallback } from 'react';
import { useTransport } from './TransportProvider';
import type { Task, TaskStatus } from './types';

export interface UseCancelTaskOptions {
  /** Whether to fetch from server on mount */
  fetchOnMount?: boolean;
}

export type UseCancelTaskResults = (taskId: string) => Promise<void>;


/**
 * Hook to subscribe to a specific task by ID
 */
export const useStepTask = (
  options: UseCancelTaskOptions = {}
): UseCancelTaskResults => {
  const transport = useTransport();

  // Step task
  const step = useCallback(async (taskId: string): Promise<void> => {
    if (!taskId) return;
    await transport.stepTask(taskId);
  }, [transport]);

  return step;
};

export default useStepTask;
