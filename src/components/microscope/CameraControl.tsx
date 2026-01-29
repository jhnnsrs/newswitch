import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSetExposure, useSetGain, useCaptureImage, useStartLiveView, useStopLiveView } from '@/hooks/generated';
import { useCameraState } from '@/hooks/states';
import { Camera, Play, Square, Image, Settings2 } from 'lucide-react';

export function CameraControl() {
  const { data: cameraState, loading: stateLoading } = useCameraState({ subscribe: true });
  const { assign: setExposure, isLoading: isSettingExposure } = useSetExposure();
  const { assign: setGain, isLoading: isSettingGain } = useSetGain();
  const { assign: captureImage, isLoading: isCapturing } = useCaptureImage();
  const { assign: startLiveView, isLoading: isStartingLive } = useStartLiveView();
  const { assign: stopLiveView, isLoading: isStoppingLive } = useStopLiveView();

  const [exposure, setExposureLocal] = useState(100);
  const [gain, setGainLocal] = useState(1);
  const [isLiveViewActive, setIsLiveViewActive] = useState(false);

  // Sync local state with server state
  useEffect(() => {
    if (cameraState?.exposure_time !== undefined) {
      setExposureLocal(cameraState.exposure_time);
    }
    if (cameraState?.gain !== undefined) {
      setGainLocal(cameraState.gain);
    }
  }, [cameraState?.exposure_time, cameraState?.gain]);

  const handleExposureChange = (value: number[]) => {
    setExposureLocal(value[0]);
  };

  const handleExposureCommit = () => {
    setExposure({ exposure_time: exposure });
  };

  const handleGainChange = (value: number[]) => {
    setGainLocal(value[0]);
  };

  const handleGainCommit = () => {
    setGain({ gain: gain });
  };

  const handleToggleLiveView = () => {
    if (isLiveViewActive) {
      stopLiveView({}, { notify: true });
      setIsLiveViewActive(false);
    } else {
      startLiveView({}, { notify: true });
      setIsLiveViewActive(true);
    }
  };

  const handleCapture = () => {
    captureImage({}, { notify: true });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera
            </CardTitle>
            <CardDescription>Camera settings and capture controls</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {stateLoading && <Badge variant="outline">Loading...</Badge>}
            {cameraState && (
              <Badge variant="secondary">
                Frame #{cameraState.frame_number ?? 0}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exposure Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Exposure Time
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold w-20 text-right">
                {exposure.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">ms</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[exposure]}
              onValueChange={handleExposureChange}
              onValueCommit={handleExposureCommit}
              min={0.1}
              max={5000}
              step={0.1}
              className="flex-1"
              disabled={isSettingExposure}
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleExposureCommit}
              disabled={isSettingExposure}
            >
              Set
            </Button>
          </div>
          <div className="flex gap-2">
            {[1, 10, 50, 100, 500, 1000].map((val) => (
              <Button
                key={val}
                size="sm"
                variant={Math.abs(exposure - val) < 0.5 ? 'default' : 'outline'}
                onClick={() => {
                  setExposureLocal(val);
                  setExposure({ exposure_time: val });
                }}
                className="flex-1"
                disabled={isSettingExposure}
              >
                {val}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Gain Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Gain
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold w-16 text-right">
                {gain.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">×</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[gain]}
              onValueChange={handleGainChange}
              onValueCommit={handleGainCommit}
              min={1}
              max={64}
              step={0.1}
              className="flex-1"
              disabled={isSettingGain}
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleGainCommit}
              disabled={isSettingGain}
            >
              Set
            </Button>
          </div>
          <div className="flex gap-2">
            {[1, 2, 4, 8, 16, 32].map((val) => (
              <Button
                key={val}
                size="sm"
                variant={Math.abs(gain - val) < 0.1 ? 'default' : 'outline'}
                onClick={() => {
                  setGainLocal(val);
                  setGain({ gain: val });
                }}
                className="flex-1"
                disabled={isSettingGain}
              >
                {val}×
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Capture Controls */}
        <div className="space-y-3">
          <Label>Capture Controls</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={isLiveViewActive ? 'destructive' : 'default'}
              className="h-14"
              onClick={handleToggleLiveView}
              disabled={isStartingLive || isStoppingLive}
            >
              {isLiveViewActive ? (
                <>
                  <Square className="h-5 w-5 mr-2" />
                  Stop Live
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Live
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              className="h-14"
              onClick={handleCapture}
              disabled={isCapturing}
            >
              <Image className="h-5 w-5 mr-2" />
              Capture
            </Button>
          </div>
        </div>

        {/* Current State Display */}
        {cameraState && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-muted-foreground">Exposure</div>
                <div className="font-mono font-medium">{cameraState.exposure_time?.toFixed(1)} ms</div>
              </div>
              <div>
                <div className="text-muted-foreground">Gain</div>
                <div className="font-mono font-medium">{cameraState.gain?.toFixed(1)}×</div>
              </div>
              <div>
                <div className="text-muted-foreground">Frame</div>
                <div className="font-mono font-medium">#{cameraState.frame_number ?? 0}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
