import { useSyncKeyStore, useTransportStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug } from 'lucide-react';

interface SyncKeyDebugProps {
  syncKey: string;
}

export function SyncKeyDebug({ syncKey }: SyncKeyDebugProps) {
  const syncKeyState = useSyncKeyStore((state) => state.syncKeys[syncKey]);
  const task = useTransportStore((state) => syncKeyState?.taskId ? state.tasks[syncKeyState.taskId] : undefined);

  return (
    <Card className="border-dashed border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <Bug className="h-4 w-4" />
          Debug: SyncKey "{syncKey}"
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Reference:</span>
          <span className="font-semibold truncate max-w-[150px]">{syncKeyState?.reference ?? '—'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Task ID:</span>
          <span className="font-semibold truncate max-w-[150px]">{syncKeyState?.taskId ?? '—'}</span>
        </div>
        
        {task && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge 
                variant={
                  task.status === 'completed' ? 'default' : 
                  task.status === 'failed' ? 'destructive' : 
                  task.status === 'running' ? 'secondary' : 
                  'outline'
                }
                className="text-xs"
              >
                {task.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Action:</span>
              <span className="font-semibold">{task.action}</span>
            </div>
            
            {task.progress !== undefined && task.progress !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-semibold">{task.progress}%</span>
              </div>
            )}
            
            {task.progressMessage && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Message:</span>
                <span className="text-xs break-all">{task.progressMessage}</span>
              </div>
            )}
            
            {task.error && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-destructive">Error:</span>
                <span className="text-xs break-all text-destructive">{task.error}</span>
              </div>
            )}
            
            <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
              <div className="text-[10px] text-muted-foreground">
                Created: {task.createdAt.toLocaleTimeString()}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Updated: {task.updatedAt.toLocaleTimeString()}
              </div>
            </div>
          </>
        )}
        
        {!task && syncKeyState?.reference && !syncKeyState?.taskId && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400 italic">
            Reference set, waiting for task assignment...
          </div>
        )}
        
        {!task && syncKeyState?.taskId && (
          <div className="text-xs text-destructive">
            Task ID exists but task not found in store
          </div>
        )}
        
        {!syncKeyState && (
          <div className="text-xs text-muted-foreground italic">
            No active task for this sync key
          </div>
        )}
      </CardContent>
    </Card>
  );
}
