import { defaultAppKey } from "@/apps";
import {
  useResumeAppTask,
  type UseAppTaskMutationResult,
} from "@/lib/rekuest/task";

export interface UseCancelTaskOptions {
  /** Whether to fetch from server on mount */
  fetchOnMount?: boolean;
}

export type UseCancelTaskResults = UseAppTaskMutationResult;

/**
 * Hook to subscribe to a specific task by ID
 */
export const useResumeTask = (): UseCancelTaskResults => {
  return useResumeAppTask(defaultAppKey);
};

export default useResumeTask;
