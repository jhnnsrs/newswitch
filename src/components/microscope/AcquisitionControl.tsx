import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useZStackAcquisition, useTimelapseAcquisition, useRunExperiment, useMultipointAcquisition } from '@/hooks/generated';
import { Layers, Clock, Play, FlaskConical, MapPin, Square } from 'lucide-react';
import type { Task } from '@/transport/types';

export function AcquisitionControl() {
  const { 
    assign: startZStack, 
    isLoading: isZStacking,
    task: zStackTask,
    progress: zStackProgress,
  } = useZStackAcquisition();
  
  const { 
    assign: startTimelapse, 
    isLoading: isTimelapsing,
    task: timelapseTask,
    progress: timelapseProgress,
  } = useTimelapseAcquisition();
  
  const { 
    assign: runExperiment, 
    isLoading: isExperimenting,
    task: experimentTask,
    progress: experimentProgress,
  } = useRunExperiment();
  
  const { 
    assign: startMultipoint, 
    isLoading: isMultipointing,
    task: multipointTask,
    progress: multipointProgress,
  } = useMultipointAcquisition();

  const handleZStack = () => {
    startZStack({}, { notify: true });
  };

  const handleTimelapse = () => {
    startTimelapse({}, { notify: true });
  };

  const handleExperiment = () => {
    runExperiment({}, { notify: true });
  };

  const handleMultipoint = () => {
    startMultipoint({}, { notify: true });
  };

  const isAnyRunning = isZStacking || isTimelapsing || isExperimenting || isMultipointing;

  const getTaskStatus = (task: Task | null): string | null => {
    if (!task) return null;
    return task.status;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Acquisition
            </CardTitle>
            <CardDescription>Start automated acquisition protocols</CardDescription>
          </div>
          {isAnyRunning && (
            <Badge variant="default" className="animate-pulse">
              Running...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Z-Stack */}
        <div className="space-y-2">
          <Button
            variant={isZStacking ? 'secondary' : 'outline'}
            className="w-full h-14 justify-start"
            onClick={handleZStack}
            disabled={isAnyRunning}
          >
            <Layers className="h-5 w-5 mr-3" />
            <div className="flex-1 text-left">
              <div className="font-medium">Z-Stack</div>
              <div className="text-xs text-muted-foreground">Acquire 3D volume</div>
            </div>
            {isZStacking && <Square className="h-4 w-4 animate-pulse" />}
          </Button>
          {isZStacking && zStackProgress !== null && (
            <Progress value={zStackProgress} className="h-2" />
          )}
        </div>

        {/* Timelapse */}
        <div className="space-y-2">
          <Button
            variant={isTimelapsing ? 'secondary' : 'outline'}
            className="w-full h-14 justify-start"
            onClick={handleTimelapse}
            disabled={isAnyRunning}
          >
            <Clock className="h-5 w-5 mr-3" />
            <div className="flex-1 text-left">
              <div className="font-medium">Timelapse</div>
              <div className="text-xs text-muted-foreground">Time-series acquisition</div>
            </div>
            {isTimelapsing && <Square className="h-4 w-4 animate-pulse" />}
          </Button>
          {isTimelapsing && timelapseProgress !== null && (
            <Progress value={timelapseProgress} className="h-2" />
          )}
        </div>

        {/* Multipoint */}
        <div className="space-y-2">
          <Button
            variant={isMultipointing ? 'secondary' : 'outline'}
            className="w-full h-14 justify-start"
            onClick={handleMultipoint}
            disabled={isAnyRunning}
          >
            <MapPin className="h-5 w-5 mr-3" />
            <div className="flex-1 text-left">
              <div className="font-medium">Multipoint</div>
              <div className="text-xs text-muted-foreground">Multiple position acquisition</div>
            </div>
            {isMultipointing && <Square className="h-4 w-4 animate-pulse" />}
          </Button>
          {isMultipointing && multipointProgress !== null && (
            <Progress value={multipointProgress} className="h-2" />
          )}
        </div>

        {/* Run Experiment */}
        <div className="pt-4 border-t">
          <Button
            variant={isExperimenting ? 'destructive' : 'default'}
            className="w-full h-16"
            onClick={handleExperiment}
            disabled={isAnyRunning}
          >
            <Play className="h-6 w-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold text-lg">Run Experiment</div>
              <div className="text-xs opacity-80">Execute full experiment protocol</div>
            </div>
          </Button>
          {isExperimenting && experimentProgress !== null && (
            <Progress value={experimentProgress} className="h-2 mt-2" />
          )}
        </div>

        {/* Active Task Status */}
        {(zStackTask || timelapseTask || multipointTask || experimentTask) && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="text-sm font-medium">Active Tasks</div>
            <div className="space-y-1 text-xs">
              {zStackTask && (
                <div className="flex justify-between">
                  <span>Z-Stack</span>
                  <Badge variant={getTaskStatus(zStackTask) === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {getTaskStatus(zStackTask)}
                  </Badge>
                </div>
              )}
              {timelapseTask && (
                <div className="flex justify-between">
                  <span>Timelapse</span>
                  <Badge variant={getTaskStatus(timelapseTask) === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {getTaskStatus(timelapseTask)}
                  </Badge>
                </div>
              )}
              {multipointTask && (
                <div className="flex justify-between">
                  <span>Multipoint</span>
                  <Badge variant={getTaskStatus(multipointTask) === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {getTaskStatus(multipointTask)}
                  </Badge>
                </div>
              )}
              {experimentTask && (
                <div className="flex justify-between">
                  <span>Experiment</span>
                  <Badge variant={getTaskStatus(experimentTask) === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {getTaskStatus(experimentTask)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
