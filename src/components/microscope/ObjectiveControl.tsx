import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSwitchObjective, useToggleObjective } from '@/hooks/generated';
import { useObjectiveState } from '@/hooks/states';
import { CircleDot, RefreshCw, Target } from 'lucide-react';

const OBJECTIVES = [
  { slot: 1, magnification: 4, name: '4× Plan', na: 0.1 },
  { slot: 2, magnification: 10, name: '10× Plan', na: 0.25 },
  { slot: 3, magnification: 20, name: '20× Plan', na: 0.4 },
  { slot: 4, magnification: 40, name: '40× Plan', na: 0.65 },
  { slot: 5, magnification: 60, name: '60× Oil', na: 1.4 },
  { slot: 6, magnification: 100, name: '100× Oil', na: 1.45 },
];

export function ObjectiveControl() {
  const { data: objectiveState, loading: stateLoading } = useObjectiveState({ subscribe: true });
  const { assign: switchObjective, isLoading: isSwitching } = useSwitchObjective();
  const { assign: toggleObjective, isLoading: isToggling } = useToggleObjective();

  const [selectedSlot, setSelectedSlot] = useState(1);

  // Sync with server state
  useEffect(() => {
    if (objectiveState?.slot !== undefined) {
      setSelectedSlot(objectiveState.slot);
    }
  }, [objectiveState?.slot]);

  const handleSelectObjective = (slot: number) => {
    setSelectedSlot(slot);
    switchObjective({ slot }, { notify: true });
  };

  const handleToggle = () => {
    toggleObjective({}, { notify: true });
  };

  const currentObjective = OBJECTIVES.find(o => o.slot === objectiveState?.slot) ?? OBJECTIVES.find(o => o.slot === selectedSlot);
  const isLoading = isSwitching || isToggling;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objective
            </CardTitle>
            <CardDescription>Select and configure objective lens</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {stateLoading && <Badge variant="outline">Loading...</Badge>}
            {isLoading && <Badge variant="secondary">Switching...</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Objective Display */}
        {currentObjective && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {objectiveState?.magnification ?? currentObjective.magnification}×
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {objectiveState?.name ?? currentObjective.name}
                  </h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Slot {objectiveState?.slot ?? currentObjective.slot}</span>
                    <span>NA {currentObjective.na}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggle}
                disabled={isLoading}
                title="Toggle to next objective"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        )}

        {/* Objective Grid */}
        <div className="space-y-3">
          <Label>Objective Turret</Label>
          <div className="grid grid-cols-3 gap-3">
            {OBJECTIVES.map((objective) => {
              const isActive = objectiveState?.slot === objective.slot;
              const isSelected = selectedSlot === objective.slot;
              
              return (
                <Button
                  key={objective.slot}
                  variant={isActive ? 'default' : isSelected ? 'secondary' : 'outline'}
                  className={`flex flex-col h-auto py-4 relative ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => handleSelectObjective(objective.slot)}
                  disabled={isLoading}
                >
                  {isActive && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                  <CircleDot className="h-6 w-6 mb-2" />
                  <span className="text-lg font-bold">{objective.magnification}×</span>
                  <span className="text-xs text-muted-foreground">{objective.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">NA {objective.na}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Quick Switch Buttons */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Quick Switch</Label>
          <div className="flex gap-2">
            {[4, 10, 20, 40].map((mag) => {
              const obj = OBJECTIVES.find(o => o.magnification === mag);
              if (!obj) return null;
              
              const isActive = objectiveState?.slot === obj.slot;
              
              return (
                <Button
                  key={mag}
                  variant={isActive ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleSelectObjective(obj.slot)}
                  disabled={isLoading}
                >
                  {mag}×
                </Button>
              );
            })}
          </div>
        </div>

        {/* Objective Info */}
        {objectiveState && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-muted-foreground">Slot</div>
                <div className="font-mono font-medium">{objectiveState.slot}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Magnification</div>
                <div className="font-mono font-medium">{objectiveState.magnification}×</div>
              </div>
              <div>
                <div className="text-muted-foreground">Name</div>
                <div className="font-mono font-medium">{objectiveState.name}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
