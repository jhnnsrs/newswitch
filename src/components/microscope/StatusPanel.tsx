import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCameraState, useIlluminationState, useObjectiveState, useStageState } from '@/hooks/states';
import { Activity, AlertCircle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

export function StatusPanel() {
  
  const { data: camera, loading: cameraLoading } = useCameraState({ subscribe: true });
  const { data: stage, loading: stageLoading } = useStageState({ subscribe: true });
  const { data: illumination, loading: illuminationLoading } = useIlluminationState({ subscribe: true });
  const { data: objective, loading: objectiveLoading } = useObjectiveState({ subscribe: true });



  const isAnyLoading = cameraLoading || stageLoading || illuminationLoading || objectiveLoading;

  const getConnectionStatus = () => {
    if (isAnyLoading) return 'loading';
    if (camera && stage && illumination && objective) return 'connected';
    if (camera || stage || illumination || objective) return 'partial';
    return 'disconnected';
  };

  const connectionStatus = getConnectionStatus();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Microscope connection and state</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                connectionStatus === 'connected' ? 'default' :
                connectionStatus === 'partial' ? 'secondary' :
                connectionStatus === 'loading' ? 'outline' :
                'destructive'
              }
              className="gap-1"
            >
              {connectionStatus === 'connected' && <CheckCircle2 className="h-3 w-3" />}
              {connectionStatus === 'partial' && <AlertCircle className="h-3 w-3" />}
              {connectionStatus === 'disconnected' && <XCircle className="h-3 w-3" />}
              {connectionStatus === 'loading' && <RefreshCw className="h-3 w-3 animate-spin" />}
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'partial' ? 'Partial' :
               connectionStatus === 'loading' ? 'Loading' : 'Disconnected'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Component Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Status */}
          <div className={`p-3 rounded-lg ${camera ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Camera</span>
              {cameraLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : camera ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {camera && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Exp: {camera.exposure_time?.toFixed(1)}ms</div>
                <div>Gain: {camera.gain?.toFixed(1)}×</div>
              </div>
            )}
          </div>

          {/* Stage Status */}
          <div className={`p-3 rounded-lg ${stage ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Stage</span>
              {stageLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : stage ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {stage && (
              <div className="text-xs text-muted-foreground">
                <div>X:{stage.x?.toFixed(0)} Y:{stage.y?.toFixed(0)}</div>
                <div>Z:{stage.z?.toFixed(0)}</div>
              </div>
            )}
          </div>

          {/* Illumination Status */}
          <div className={`p-3 rounded-lg ${illumination ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Illumination</span>
              {illuminationLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : illumination ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {illumination && (
              <div className="text-xs text-muted-foreground">
                <div>Int: {illumination.intensity}%</div>
                <div>{illumination.wavelength}nm</div>
              </div>
            )}
          </div>

          {/* Objective Status */}
          <div className={`p-3 rounded-lg ${objective ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Objective</span>
              {objectiveLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : objective ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {objective && (
              <div className="text-xs text-muted-foreground">
                <div>{objective.magnification}× {objective.name}</div>
                <div>Slot {objective.slot}</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
