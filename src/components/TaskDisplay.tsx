import { useTransportStore } from "@/store";
import { useCancelTask } from "@/transport/useCancelTask";
import { usePauseTask } from "@/transport/usePauseTask";
import { useResumeTask } from "@/transport/useResumeTask";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export const ProgressDisplay = (props: {activeTaskId: string | null | undefined}) => {
  const activeTaskId = props.activeTaskId;
  const task = useTransportStore(
    (state) => state.tasks[activeTaskId || ''] || undefined
  );
  const cancel = useCancelTask();
  const resume = useResumeTask();
  const pause = usePauseTask()

  if (!task && !activeTaskId) return null;

  if (!task && activeTaskId)
    return (
      <div className="flex items-center justify-between text-muted-foreground text-sm p-3 bg-muted/50 rounded-lg">
        <span>Another app is controlling the stage</span>
        <Button variant="outline" size="sm" onClick={() => cancel(activeTaskId!)}>
          Cancel
        </Button>
      </div>
    );

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Moving stage...</span>
        {task.progress !== null && task.progress !== undefined && (
          <span className="font-mono font-semibold">
            {Math.round(task.progress)}%
          </span>
        )}
      </div>
      <Progress value={task.progress ?? 0} className="h-1.5" />
      <div className='flex flex-row w-full gap-2'>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => cancel(activeTaskId!)}
      >
        Cancel
      </Button>
      {task.status === "paused" ? (
        
        <Button
        variant="outline"
        size="sm"
        className="flex-1 animate-pulse "
        onClick={() => resume(activeTaskId!)}
      >
        Resume
      </Button>
      ):(
        <Button
        variant="destructive"
        size="sm"
        className="flex-1"
        onClick={() => pause(activeTaskId!)}
      >
        Pause
      </Button>
      )}
      </div>
    </div>
  );
}