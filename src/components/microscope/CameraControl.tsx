import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  useCaptureImage,
  useStartLiveView,
  useStopLiveView,
  useActivateDetector,
  useDeactivateDetector,
  useUpdateDetector,
} from '@/hooks/generated';
import { useCameraState } from '@/hooks/states';
import { Camera, Play, Square, Image, Timer, Gauge, MonitorUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimisticSlider } from '../ui/optimistic_slider';

export function CameraControl() {
  const { data: cameraState, loading: stateLoading } = useCameraState({
    subscribe: true,
  });
  const {
    assign: captureImage,
    isLoading: isCapturing,
    isLocked: isCapturingLocked,
  } = useCaptureImage();
  const { assign: startLiveView, isLoading: isStartingLive } = useStartLiveView();
  const { assign: stopLiveView, isLoading: isStoppingLive } = useStopLiveView();
  const { assign: activateDetector, isLoading: isActivating } = useActivateDetector();
  const { assign: deactivateDetector, isLoading: isDeactivating } = useDeactivateDetector();
  const { call: updateDetector, isLoading: isUpdating } = useUpdateDetector();

  // Local state for slider dragging
  const [localExposures, setLocalExposures] = useState<Record<number, number>>({});
  const [localGains, setLocalGains] = useState<Record<number, number>>({});
  const [selectedDetectorSlot, setSelectedDetectorSlot] = useState<number | null>(null);

  const isLive = cameraState?.is_acquiring ?? false;
  const activeSlots = new Set(cameraState?.active_detectors?.map((d) => d.slot) ?? []);
  const hasActiveDetectors = activeSlots.size > 0;

  const getActiveDetector = (slot: number) => {
    return cameraState?.active_detectors?.find((d) => d.slot === slot);
  };

  const handleToggleDetector = (slot: number, enabled: boolean) => {
    if (enabled) {
      activateDetector({ slot });
    } else {
      deactivateDetector({ slot });
    }
  };

  const handleExposureChange = (slot: number, value: number) => {
    setLocalExposures((prev) => ({ ...prev, [slot]: value }));
  };

  const handleExposureCommit = (slot: number) => {
    const exposure = localExposures[slot];
    if (exposure !== undefined) {
      updateDetector({ slot, exposure_time: exposure });
      setLocalExposures((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    }
  };

  const handleGainChange = (slot: number, value: number) => {
    setLocalGains((prev) => ({ ...prev, [slot]: value }));
  };

  const handleGainCommit = (slot: number) => {
    const gain = localGains[slot];
    if (gain !== undefined) {
      updateDetector({ slot, gain });
      setLocalGains((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    }
  };

  const handleToggleLiveView = () => {
    if (isLive) {
      stopLiveView({});
    } else {
      startLiveView({});
    }
  };

  const handleCapture = () => {
    captureImage({});
  };

  const isLiveLoading = isStartingLive || isStoppingLive;
  const isDetectorLoading = isActivating || isDeactivating;

  return (
    <div className="space-y-4">

      {/* Detectors */}
      <div className="space-y-3">
        {cameraState?.available_detectors?.map((detector) => {
          const isActive = activeSlots.has(detector.slot);
          const activeData = getActiveDetector(detector.slot);
          const currentExposure =
            localExposures[detector.slot] ?? activeData?.exposure_time ?? detector.min_exposure_time;
          const currentGain =
            localGains[detector.slot] ?? activeData?.gain ?? detector.min_gain;
          const isExpanded = selectedDetectorSlot === detector.slot;

          return (
            <div
              key={detector.slot}
              className={cn(
                'rounded-lg border transition-all',
                isActive
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-muted/30 border-transparent'
              )}
            >
              {/* Detector Header */}
              <div
                className="p-3 cursor-pointer"
                onClick={() =>
                  setSelectedDetectorSlot(isExpanded ? null : detector.slot)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MonitorUp
                      className={cn(
                        'h-4 w-4',
                        isActive && 'text-green-500'
                      )}
                    />
                    <span className="text-sm font-medium">{detector.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && activeData && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {activeData.exposure_time.toFixed(0)}ms / {activeData.gain.toFixed(1)}×
                      </span>
                    )}
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        handleToggleDetector(detector.slot, checked)
                      }
                      disabled={isDetectorLoading}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Compact info */}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {detector.width}×{detector.height}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {detector.pixel_size_um}µm
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Slot {detector.slot}
                  </span>
                </div>
              </div>

              {/* Expanded Controls */}
              {isExpanded && isActive && (
                <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                  {/* Exposure Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Timer className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Exposure
                        </span>
                      </div>
                      <span className="text-xs font-mono">
                        {currentExposure.toFixed(1)} ms
                      </span>
                    </div>
                    <OptimisticSlider
                      value={[currentExposure]}
                      onSave={(v) => updateDetector(
                        { slot: detector.slot, exposure_time: v[0] }
                      )}
                      min={detector.min_exposure_time}
                      max={detector.max_exposure_time}
                      step={0.1}
                      className="flex-1"
                      disabled={isUpdating}
                    />
                    {detector.preset_exposure_times?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {detector.preset_exposure_times.slice(0, 6).map((val) => (
                          <Button
                            key={val}
                            size="sm"
                            variant={
                              Math.abs((activeData?.exposure_time ?? 0) - val) < 0.5
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() => updateDetector({ slot: detector.slot, exposure_time: val })}
                            className="h-6 text-xs px-2"
                            disabled={isUpdating}
                          >
                            {val >= 1000 ? `${val / 1000}s` : `${val}ms`}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gain Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Gain
                        </span>
                      </div>
                      <span className="text-xs font-mono">
                        {currentGain.toFixed(1)}×
                      </span>
                    </div>
                    <OptimisticSlider
                      value={[currentGain]}
                      onValueChange={(v) =>
                        handleGainChange(detector.slot, v[0])
                      }
                      onValueCommit={() => handleGainCommit(detector.slot)}
                      min={detector.min_gain}
                      max={detector.max_gain}
                      step={0.1}
                      className="flex-1"
                      disabled={isUpdating}
                    />
                    <div className="flex gap-1">
                      {[1, 2, 4, 8, 16, 32]
                        .filter(
                          (v) => v >= detector.min_gain && v <= detector.max_gain
                        )
                        .map((val) => (
                          <Button
                            key={val}
                            size="sm"
                            variant={
                              Math.abs((activeData?.gain ?? 0) - val) < 0.1
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() => updateDetector({ slot: detector.slot, gain: val })}
                            className="flex-1 h-6 text-xs px-1"
                            disabled={isUpdating}
                          >
                            {val}×
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {(!cameraState?.available_detectors ||
          cameraState.available_detectors.length === 0) &&
          !stateLoading && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No detectors available
            </div>
          )}
      </div>
    </div>
  );
}
