import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMoveStage, useMoveHome } from '@/hooks/generated';
import { useStageState } from '@/hooks/states';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, Move } from 'lucide-react';

const STEP_SIZES = [1, 10, 100, 1000];

export function StageControl() {
  const { data: stageState, loading: stateLoading } = useStageState({ subscribe: true });
  const { assign: moveStage, isLoading: isMoving } = useMoveStage();
  const { assign: moveHome, isLoading: isHomeing } = useMoveHome();
  
  const [stepSize, setStepSize] = useState(100);
  const [zStep, setZStep] = useState(10);
  const [targetX, setTargetX] = useState('');
  const [targetY, setTargetY] = useState('');
  const [targetZ, setTargetZ] = useState('');

  const handleRelativeMove = (axis: 'x' | 'y' | 'z', direction: 1 | -1) => {
    const step = axis === 'z' ? zStep : stepSize;
    moveStage({ [axis]: step * direction, is_absolute: false }, { notify: true });
  };

  const handleAbsoluteMove = () => {
    const args: { x?: number; y?: number; z?: number; is_absolute: boolean } = { is_absolute: true };
    if (targetX) args.x = parseFloat(targetX);
    if (targetY) args.y = parseFloat(targetY);
    if (targetZ) args.z = parseFloat(targetZ);
    moveStage(args, { notify: true });
  };

  const isLoading = isMoving || isHomeing;

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
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                disabled={isLoading}
                onClick={() => handleRelativeMove('y', 1)}
              >
                <ArrowUp className="h-6 w-6" />
              </Button>
              <div />
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                disabled={isLoading}
                onClick={() => handleRelativeMove('x', -1)}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12"
                disabled={isLoading}
                onClick={() => moveHome({}, { notify: true })}
              >
                <Home className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                disabled={isLoading}
                onClick={() => handleRelativeMove('x', 1)}
              >
                <ArrowRight className="h-6 w-6" />
              </Button>
              <div />
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                disabled={isLoading}
                onClick={() => handleRelativeMove('y', -1)}
              >
                <ArrowDown className="h-6 w-6" />
              </Button>
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
            <Button
              variant="outline"
              className="flex-1 h-12"
              disabled={isLoading}
              onClick={() => handleRelativeMove('z', 1)}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Focus Up
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12"
              disabled={isLoading}
              onClick={() => handleRelativeMove('z', -1)}
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Focus Down
            </Button>
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
          </div>
          <Button 
            onClick={handleAbsoluteMove} 
            disabled={isLoading || (!targetX && !targetY && !targetZ)}
            className="w-full"
          >
            <Move className="h-4 w-4 mr-2" />
            Move to Position
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
