import * as React from 'react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGlobalStateStore } from '@/store';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface LockedSliderProps extends React.ComponentProps<typeof Slider> {
  lockKeys?: string[];
}

export function LockedSlider({ lockKeys = [], className, disabled, ...props }: LockedSliderProps) {
  // Check all lockKeys sto see if any have an active task
  const locks = useGlobalStateStore((state) => state.locks);
  
  // Find the first lockKey that has a task blocking it
  const blockingLock = lockKeys.find(key => locks[key] !== undefined);
  const blockingTaskId = blockingLock ? locks[blockingLock] : undefined;
  const isLocked = !!blockingTaskId;

  const slider = (
    <div className={cn("relative", isLocked && "opacity-60")}>
      <Slider
        className={cn(className)}
        disabled={disabled || isLocked}
        {...props}
      />
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Lock className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );

  if (isLocked && !disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {slider}
          </TooltipTrigger>
          <TooltipContent>
            <p>Blocked by task: {blockingTaskId}</p>
            {blockingLock && <p className="text-xs text-muted-foreground">Lock: {blockingLock}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return slider;
}
