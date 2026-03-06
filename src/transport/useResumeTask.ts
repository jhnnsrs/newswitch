// src/transport/useTask.ts

import { useCallback } from "react";
import { useAction } from "./action-context";

export interface UseCancelTaskOptions {
  /** Whether to fetch from server on mount */
  fetchOnMount?: boolean;
}

export type UseCancelTaskResults = (taskId: string) => Promise<void>;

/**
 * Hook to subscribe to a specific task by ID
 */
export const useResumeTask = (): UseCancelTaskResults => {
  const action = useAction();

  // Resume task
  const resume = useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.unpauseTask(taskId);
    },
    [action],
  );

  return resume;
};

export default useResumeTask;
