import { defaultAppKey } from "@/apps";
import {
  useStepAppTask,
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
export const useStepTask = (): UseCancelTaskResults => {
  return useStepAppTask(defaultAppKey);
};

export default useStepTask;
