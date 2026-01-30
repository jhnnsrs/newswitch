import { ActionButton } from '@/components/ActionButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { MoveHomeDefinition, MoveStageDefinition } from '@/hooks/generated';
import { useStagePositionLock } from '@/hooks/locks';
import { useStageState } from '@/hooks/states';
import { useTransportStore } from '@/store';
import useCancelTask from '@/transport/useCancelTask';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Home, Move } from 'lucide-react';
import {  useState } from 'react';

const STEP_SIZES = [1, 10, 100, 1000];


export const ProgressDisplay = () => {

  const activeTaskId = useStagePositionLock();
  const task = useTransportStore((state) => state.tasks[activeTaskId || ''] || undefined);
  const cancel = useCancelTask();


  if (!task && !activeTaskId) return null;

  if (!task && activeTaskId) return <> Unknown task controlling this</>;

  return (
    <div className="space-y-2 pt-4 border-t">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Moving stage...</span>
        {task.progress !== null && task.progress !== undefined && (
          <span className="font-mono font-semibold">{Math.round(task.progress)}%</span>
        )}
      </div>
      <Progress 
        value={task.progress ?? 0} 
        className="h-2"
      />
      <Button variant="outline" size="sm" onClick={() => cancel(activeTaskId!)}>Cancel</Button>
    </div>
  );
};

export function StageControl() {
  const { data: stageState, loading: stateLoading } = useStageState({ subscribe: true });
  
  const activeTaskId = useStagePositionLock();
  const [stepSize, setStepSize] = useState(10);
  const [zStep, setZStep] = useState(10);
  const [targetX, setTargetX] = useState('');
  const [targetY, setTargetY] = useState('');
  const [targetZ, setTargetZ] = useState('');

  const isLoading = !!activeTaskId;
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Move className="h-5 w-5" />
              Stage Control
            </CardTitle>
            <CardDescription>Control microscope stage position</CardDescription>
          </div>
          {isLoading && <Badge variant="secondary">Moving...</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Position Display */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase">X</div>
            <div className="text-lg font-mono font-bold">
              {stateLoading ? '...' : stageState?.x?.toFixed(2) ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">µm</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase">Y</div>
            <div className="text-lg font-mono font-bold">
              {stateLoading ? '...' : stageState?.y?.toFixed(2) ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">µm</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase">Z</div>
            <div className="text-lg font-mono font-bold">
              {stateLoading ? '...' : stageState?.z?.toFixed(2) ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">µm</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase">A</div>
            <div className="text-lg font-mono font-bold">
              {stateLoading ? '...' : stageState?.a?.toFixed(2) ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">°</div>
          </div>
        </div>

        {/* XY Joystick Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>XY Movement</Label>
            <div className="flex gap-1">
              {STEP_SIZES.map((size) => (
                <Button
                  key={size}
                  size="sm"
                  variant={stepSize === size ? 'default' : 'outline'}
                  onClick={() => setStepSize(size)}
                  className="w-14"
                >
                  {size}µm
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-1">
              <div />
              <ActionButton
                action={MoveStageDefinition}
                args={{ y: stepSize, is_absolute: false }}
                variant="outline"
                size="icon"
                className="h-12 w-12"
              >
                <ArrowUp className="h-6 w-6" />
              </ActionButton>
              <div />
              <ActionButton
                action={MoveStageDefinition}
                args={{ x: -stepSize, is_absolute: false }}
                variant="outline"
                size="icon"
                className="h-12 w-12"
              >
                <ArrowLeft className="h-6 w-6" />
              </ActionButton>
              <ActionButton
                action={MoveHomeDefinition}
                args={{}}
                variant="secondary"
                size="icon"
                className="h-12 w-12"
              >
                <Home className="h-5 w-5" />
              </ActionButton>
              <ActionButton
                action={MoveStageDefinition}
                args={{ x: stepSize, is_absolute: false }}
                variant="outline"
                size="icon"
                className="h-12 w-12"
              >
                <ArrowRight className="h-6 w-6" />
              </ActionButton>
              <div />
              <ActionButton
                action={MoveStageDefinition}
                args={{ y: -stepSize, is_absolute: false }}
                variant="outline"
                size="icon"
                className="h-12 w-12"
              >
                <ArrowDown className="h-6 w-6" />
              </ActionButton>
              <div />
            </div>
          </div>
        </div>

        {/* Z Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Z (Focus)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={zStep}
                onChange={(e) => setZStep(parseFloat(e.target.value) || 10)}
                className="w-20 h-8"
              />
              <span className="text-sm text-muted-foreground">µm</span>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <ActionButton
              action={MoveStageDefinition}
              args={{ z: zStep, is_absolute: false }}
              variant="outline"
              className="flex-1 h-12"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Focus Up
            </ActionButton>
            <ActionButton
              action={MoveStageDefinition}
              args={{ z: -zStep, is_absolute: false }}
              variant="outline"
              className="flex-1 h-12"
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Focus Down
            </ActionButton>
          </div>
        </div>

        {/* Absolute Position */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Go to Position</Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">X (µm)</Label>
              <Input
                type="number"
                placeholder="X"
                value={targetX}
                onChange={(e) => setTargetX(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Y (µm)</Label>
              <Input
                type="number"
                placeholder="Y"
                value={targetY}
                onChange={(e) => setTargetY(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Z (µm)</Label>
              <Input
                type="number"
                placeholder="Z"
                value={targetZ}
                onChange={(e) => setTargetZ(e.target.value)}
              />
            </div>
          <ActionButton
            action={MoveStageDefinition}
            args={{
              x: targetX ? parseFloat(targetX) : undefined,
              y: targetY ? parseFloat(targetY) : undefined,
              z: targetZ ? parseFloat(targetZ) : undefined,
              is_absolute: true
            }}
            disabled={!targetX && !targetY && !targetZ}
            className="w-full"
          >
            <Move className="h-4 w-4 mr-2" />
            Move to Position
          </ActionButton>
        </div>
        
          <ProgressDisplay />
        </div>
      </CardContent>
    </Card>
  );
}
