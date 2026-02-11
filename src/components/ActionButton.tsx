import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useGlobalStateStore } from '@/store';
import { useTransport } from '@/transport/TransportProvider';
import { type AssignOptions } from '@/transport/types';
import { type ActionDefinition } from '@/transport/useTransportAction';
import { type VariantProps } from 'class-variance-authority';
import React, { type ButtonHTMLAttributes } from 'react';
import { toast } from 'sonner';

/** Generate a unique local reference */
function generateReference(): string {
  return `ref-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface ActionButtonProps<TArgs, TReturn> extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'action' | 'onError'>, VariantProps<typeof buttonVariants> {
  action: ActionDefinition<TArgs, TReturn>;
  args: TArgs;
  step?: boolean; // Optional prop to indicate if we should step and pause on the first pausepoint
  assignOptions?: AssignOptions;
  children?: React.ReactNode;
}

export function ActionButton<TArgs, TReturn>({
  action,
  args,
  assignOptions,
  className,
  variant,
  size,
  step,
  children,
  onClick,
  disabled,
  ...props
}: ActionButtonProps<TArgs, TReturn>) {
  // Check all lockKeys to see if any have an active task
  const locks = useGlobalStateStore((state) => state.locks);
  
  // Find the first lockKey that has a task blocking it
  const blockingLock = action.lockKeys?.find(key => locks[key] !== undefined);
  const blockingTaskId = blockingLock ? locks[blockingLock] : undefined;
  const isLocked = !!blockingTaskId;

  const transport = useTransport();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.isDefaultPrevented()) return;

    // Check if any lockKey has an active task
    if (isLocked) {
      toast.warning('Action locked', {
        description: `Another task (${blockingTaskId}) is using a required resource.`
      });
      return;
    }

    // Generate a local reference before assignment
    const reference = generateReference();

    try {
      console.log('Assigning action:', action.name, 'with args:', args, 'reference:', reference);
      const task = await transport.assign(action.name, args, { ...assignOptions, reference, step });
      console.log('Assigned task:', task);
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        toast.error(`Failed to assign ${action.name}`, { description: e.message });
      }
    }
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={disabled || isLocked}
      onClick={handleClick}
      data-locked={isLocked}
      data-blocking-task={blockingTaskId}
      {...props}
    >
      {children || action.name}
    </Button>
  );

  // If locked, wrap in tooltip showing the blocking task
  if (isLocked && !disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>Blocked by task: {blockingTaskId}</p>
            {blockingLock && <p className="text-xs text-muted-foreground">Lock: {blockingLock}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
