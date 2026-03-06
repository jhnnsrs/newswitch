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
export const useCancelTask = (): UseCancelTaskResults => {
  const action = useAction();

  // Cancel task
  const cancel = useCallback(
    async (taskId: string): Promise<void> => {
      if (!taskId) return;
      await action.cancelTask(taskId);
    },
    [action],
  );

  return cancel;
};

export default useCancelTask;
