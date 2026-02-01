import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LockedSlider } from '@/components/ui/locked-slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  useSetExposure, 
  useSetGain, 
  useSetIllumination, 
  useTurnOffIllumination,
  useSwitchObjective,
  useStartLiveView,
  useStopLiveView
} from '@/hooks/generated';
import { useCameraState, useIlluminationState, useObjectiveState } from '@/hooks/states';
import { useCaptureAndDownload } from '@/hooks/useCaptureAndDownload';
import { 
  Camera, 
  Sun, 
  Target, 
  ChevronDown,
  Settings2,
  Play,
  Square,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

function SettingsSection({ title, icon, children, defaultOpen = true, badge }: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 hover:bg-accent rounded-md">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
          {badge && <Badge variant="secondary" className="text-xs ml-2">{badge}</Badge>}
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SettingsPanel() {
  const { data: cameraState } = useCameraState({ subscribe: true });
  const { data: illuminationState } = useIlluminationState({ subscribe: true });
  const { data: objectiveState } = useObjectiveState({ subscribe: true });
  
  const { assign: setExposure, isLocked: isExposureLocked, lockedByKey: exposureLockKey } = useSetExposure();
  const { assign: setGain, lockedByKey: gainLockKey } = useSetGain();
  const { assign: setIllumination, isLocked: isIlluminationLocked } = useSetIllumination();
  const { assign: turnOffIllumination, isLocked: isTurnOffLocked } = useTurnOffIllumination();
  const { assign: switchObjective, isLocked: isObjectiveLocked } = useSwitchObjective();
  
  // Live view and capture controls
  const { assign: startLiveView, isLoading: isStarting, isLocked: isStartLocked } = useStartLiveView();
  const { assign: stopLiveView, isLoading: isStopping, isLocked: isStopLocked } = useStopLiveView();
  const { capture, isCapturing, isDownloading, isLocked: isCaptureLocked } = useCaptureAndDownload();
  
  const isLive = cameraState?.is_acquiring ?? false;
  
  // Local overrides for sliders while dragging
  const [exposureOverride, setExposureOverride] = useState<number | null>(null);
  const [gainOverride, setGainOverride] = useState<number | null>(null);
  const [intensityOverride, setIntensityOverride] = useState<number | null>(null);
  const [isIlluminationOn, setIsIlluminationOn] = useState(false);

  // Use server state or local override
  const exposure = exposureOverride ?? cameraState?.exposure_time ?? 100;
  const gain = gainOverride ?? cameraState?.gain ?? 1;
  const intensity = intensityOverride ?? illuminationState?.intensity ?? 50;

  const handleExposureChange = (value: number[]) => {
    setExposureOverride(value[0]);
  };

  const handleExposureCommit = () => {
    setExposure({ exposure_time: exposure });
    setExposureOverride(null); // Clear override to use server state
  };

  const handleGainChange = (value: number[]) => {
    setGainOverride(value[0]);
  };

  const handleGainCommit = () => {
    setGain({ gain: gain });
    setGainOverride(null); // Clear override to use server state
  };

  const handleIntensityChange = (value: number[]) => {
    setIntensityOverride(value[0]);
  };

  const handleIntensityCommit = () => {
    if (isIlluminationOn) {
      setIllumination({ intensity, wavelength: 488, channel: 1 });
      setIntensityOverride(null);
    }
  };

  const handleIlluminationToggle = (checked: boolean) => {
    if (checked) {
      setIllumination({ intensity, wavelength: 488, channel: 1 });
      setIsIlluminationOn(true);
    } else {
      turnOffIllumination({});
      setIsIlluminationOn(false);
    }
  };

  const exposureLockKeys = exposureLockKey ? [exposureLockKey] : [];
  const gainLockKeys = gainLockKey ? [gainLockKey] : [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Settings
        </h2>
        
        {/* Acquisition Controls */}
        <div className="flex gap-1.5">
          <Button
            variant={isLive ? "destructive" : "default"}
            size="sm"
            onClick={async () => {
              if (isLive) {
                await stopLiveView({});
              } else {
                await startLiveView({});
              }
            }}
            disabled={isStarting || isStopping || isStartLocked || isStopLocked}
            className="gap-1.5 flex-1"
          >
            {isLive ? (
              <>
                <Square className="h-3 w-3" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Live
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => await capture()}
            disabled={isCapturing || isDownloading || isCaptureLocked}
            className="gap-1.5 flex-1"
          >
            {isDownloading ? (
              <Download className="h-3 w-3 animate-bounce" />
            ) : (
              <Camera className="h-3 w-3" />
            )}
            {isDownloading ? 'Save' : isCapturing ? 'Snap' : 'Snap'}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Camera Settings */}
        <SettingsSection 
          title="Camera" 
          icon={<Camera className="h-4 w-4" />}
          badge={cameraState ? `${cameraState.exposure_time?.toFixed(0)}ms` : undefined}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Exposure</Label>
                <span className="text-xs font-mono">{exposure.toFixed(1)}ms</span>
              </div>
              <LockedSlider
                value={[exposure]}
                onValueChange={handleExposureChange}
                onValueCommit={handleExposureCommit}
                min={0.1}
                max={1000}
                step={0.1}
                lockKeys={exposureLockKeys}
              />
              <div className="flex gap-1">
                {[1, 10, 50, 100, 500].map((val) => (
                  <Button
                    key={val}
                    size="sm"
                    variant={Math.abs(exposure - val) < 0.5 ? 'secondary' : 'ghost'}
                    className="flex-1 h-6 text-xs"
                    disabled={isExposureLocked}
                    onClick={() => {
                      setExposure({ exposure_time: val });
                    }}
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Gain</Label>
                <span className="text-xs font-mono">{gain.toFixed(1)}</span>
              </div>
              <LockedSlider
                value={[gain]}
                onValueChange={handleGainChange}
                onValueCommit={handleGainCommit}
                min={1}
                max={20}
                step={0.1}
                lockKeys={gainLockKeys}
              />
            </div>
          </div>
        </SettingsSection>

        <Separator />

        {/* Illumination Settings */}
        <SettingsSection 
          title="Illumination" 
          icon={<Sun className="h-4 w-4" />}
          badge={isIlluminationOn ? 'ON' : 'OFF'}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enable</Label>
              <Switch 
                checked={isIlluminationOn} 
                onCheckedChange={handleIlluminationToggle}
                disabled={isIlluminationLocked || isTurnOffLocked}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Intensity</Label>
                <span className="text-xs font-mono">{intensity}%</span>
              </div>
              <LockedSlider
                value={[intensity]}
                onValueChange={handleIntensityChange}
                onValueCommit={handleIntensityCommit}
                min={0}
                max={100}
                step={1}
                disabled={!isIlluminationOn}
                lockKeys={[]}
              />
            </div>
          </div>
        </SettingsSection>

        <Separator />

        {/* Objective Settings */}
        <SettingsSection 
          title="Objective" 
          icon={<Target className="h-4 w-4" />}
          badge={objectiveState?.slot ? `Slot ${objectiveState.slot}` : undefined}
        >
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6].map((slot) => (
              <Button
                key={slot}
                size="sm"
                variant={objectiveState?.slot === slot ? 'default' : 'outline'}
                className="h-8 text-xs"
                disabled={isObjectiveLocked}
                onClick={() => switchObjective({ slot })}
              >
                {slot}
              </Button>
            ))}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
