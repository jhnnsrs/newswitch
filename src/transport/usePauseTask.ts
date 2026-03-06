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
export const usePauseTask = (): UseCancelTaskResults => {
  const action = useAction();

  // Unpause task
  const pause = useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.pauseTask(taskId);
    },
    [action],
  );

  return pause;
};

export default usePauseTask;
