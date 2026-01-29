import React, { type ButtonHTMLAttributes } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { type VariantProps } from 'class-variance-authority';
import { type ActionDefinition } from '@/transport/useTransportAction';
import { type AssignOptions } from '@/transport/types';
import { useTransport } from '@/transport/TransportProvider';
import { useSyncKeyStore } from '@/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/** Generate a unique local reference */
function generateReference(): string {
  return `ref-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface ActionButtonProps<TArgs, TReturn> extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'action' | 'onError'>, VariantProps<typeof buttonVariants> {
  action: ActionDefinition<TArgs, TReturn>;
  args: TArgs;
  assignOptions?: AssignOptions;
  syncKey?: string;
  children?: React.ReactNode;
}

export function ActionButton<TArgs, TReturn>({
  action,
  args,
  assignOptions,
  syncKey,
  className,
  variant,
  size,
  children,
  onClick,
  disabled,
  ...props
}: ActionButtonProps<TArgs, TReturn>) {
  // Only subscribe to the specific syncKey state we need
  const hasSyncKeyActive = useSyncKeyStore((state) => 
    syncKey ? !!state.syncKeys[syncKey] : false
  );

  const transport = useTransport();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.isDefaultPrevented()) return;

    // Check if another task with the same syncKey is running
    if (syncKey && hasSyncKeyActive) {
      toast.warning('Action already in progress', {
        description: `Please wait for the current ${action.name} to complete.`
      });
      return;
    }

    // Generate a local reference before assignment
    const reference = generateReference();
    
    // Set sync key with reference before making the request
    if (syncKey) {
      useSyncKeyStore.getState().setSyncKeyReference(syncKey, reference);
    }

    try {
      console.log('Assigning action:', action.name, 'with args:', args, 'reference:', reference);
      const task = await transport.assign(action.name, args, { ...assignOptions, reference });
      console.log('Assigned task:', task);
      
      // Update sync key with task ID after successful assignment
      if (syncKey && task.id) {
        useSyncKeyStore.getState().setSyncKeyTaskId(syncKey, task.id);
      }
    } catch (e) {
      console.error(e);
      // Clear sync key on error since assignment failed
      if (syncKey) {
        useSyncKeyStore.getState().clearSyncKey(syncKey);
      }
      if (e instanceof Error) {
        toast.error(`Failed to assign ${action.name}`, { description: e.message });
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={disabled || hasSyncKeyActive}
      onClick={handleClick}
      data-sync-key={syncKey}
      data-busy={hasSyncKeyActive}
      {...props}
    >
      {children || action.name}
    </Button>
  );
}
