import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useSetIllumination, useTurnOffIllumination } from '@/hooks/generated';
import { useIlluminationState } from '@/hooks/states';
import { Lightbulb, Power, Sun, Zap } from 'lucide-react';

const CHANNELS = [
  { id: 0, name: 'Brightfield', color: 'bg-yellow-400' },
  { id: 1, name: 'DAPI', color: 'bg-blue-500' },
  { id: 2, name: 'FITC', color: 'bg-green-500' },
  { id: 3, name: 'TRITC', color: 'bg-red-500' },
  { id: 4, name: 'Cy5', color: 'bg-purple-500' },
];

const WAVELENGTHS = [
  { value: 405, label: '405nm', color: 'text-violet-400' },
  { value: 488, label: '488nm', color: 'text-blue-400' },
  { value: 561, label: '561nm', color: 'text-green-400' },
  { value: 640, label: '640nm', color: 'text-red-400' },
];

export function IlluminationControl() {
  const { data: illuminationState, loading: stateLoading } = useIlluminationState({ subscribe: true });
  const { assign: setIllumination, isLoading: isSetting } = useSetIllumination();
  const { assign: turnOffIllumination, isLoading: isTurningOff } = useTurnOffIllumination();

  const [intensity, setIntensityLocal] = useState(50);
  const [wavelength, setWavelengthLocal] = useState(488);
  const [selectedChannel, setSelectedChannel] = useState(0);
  const [isOn, setIsOn] = useState(false);

  // Sync with server state
  useEffect(() => {
    if (illuminationState?.intensity !== undefined) {
      setIntensityLocal(illuminationState.intensity);
      setIsOn(illuminationState.intensity > 0);
    }
    if (illuminationState?.wavelength !== undefined) {
      setWavelengthLocal(illuminationState.wavelength);
    }
    if (illuminationState?.channel !== undefined) {
      setSelectedChannel(illuminationState.channel);
    }
  }, [illuminationState]);

  const handleIntensityChange = (value: number[]) => {
    setIntensityLocal(value[0]);
  };

  const handleIntensityCommit = () => {
    if (intensity > 0) {
      setIllumination({ intensity, wavelength, channel: selectedChannel });
      setIsOn(true);
    }
  };

  const handleChannelSelect = (channelId: number) => {
    setSelectedChannel(channelId);
    if (isOn) {
      setIllumination({ intensity, wavelength, channel: channelId });
    }
  };

  const handleWavelengthSelect = (wl: number) => {
    setWavelengthLocal(wl);
    if (isOn) {
      setIllumination({ intensity, wavelength: wl, channel: selectedChannel });
    }
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setIllumination({ intensity: intensity || 50, wavelength, channel: selectedChannel });
      setIsOn(true);
    } else {
      turnOffIllumination({});
      setIsOn(false);
    }
  };

  const isLoading = isSetting || isTurningOff;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className={`h-5 w-5 ${isOn ? 'text-yellow-400' : ''}`} />
              Illumination
            </CardTitle>
            <CardDescription>Light source and channel control</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {stateLoading && <Badge variant="outline">Loading...</Badge>}
            <div className="flex items-center gap-2">
              <Label htmlFor="light-switch" className="text-sm">Power</Label>
              <Switch
                id="light-switch"
                checked={isOn}
                onCheckedChange={handleToggle}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Channel
          </Label>
          <div className="grid grid-cols-5 gap-2">
            {CHANNELS.map((channel) => (
              <Button
                key={channel.id}
                variant={selectedChannel === channel.id ? 'default' : 'outline'}
                className="flex flex-col h-auto py-3 relative"
                onClick={() => handleChannelSelect(channel.id)}
                disabled={isLoading}
              >
                <div className={`w-3 h-3 rounded-full ${channel.color} mb-1`} />
                <span className="text-xs">{channel.name}</span>
                {selectedChannel === channel.id && isOn && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Wavelength Selection */}
        <div className="space-y-3">
          <Label>Wavelength</Label>
          <div className="grid grid-cols-4 gap-2">
            {WAVELENGTHS.map((wl) => (
              <Button
                key={wl.value}
                variant={wavelength === wl.value ? 'default' : 'outline'}
                className="flex flex-col h-auto py-2"
                onClick={() => handleWavelengthSelect(wl.value)}
                disabled={isLoading}
              >
                <span className={`text-sm font-mono ${wl.color}`}>{wl.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Intensity Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Intensity
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold w-12 text-right">
                {intensity}
              </span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[intensity]}
              onValueChange={handleIntensityChange}
              onValueCommit={handleIntensityCommit}
              min={0}
              max={100}
              step={1}
              className="flex-1"
              disabled={isLoading || !isOn}
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleIntensityCommit}
              disabled={isLoading || !isOn}
            >
              Set
            </Button>
          </div>
          <div className="flex gap-2">
            {[0, 25, 50, 75, 100].map((val) => (
              <Button
                key={val}
                size="sm"
                variant={intensity === val ? 'default' : 'outline'}
                onClick={() => {
                  setIntensityLocal(val);
                  if (val === 0) {
                    turnOffIllumination({});
                    setIsOn(false);
                  } else if (isOn) {
                    setIllumination({ intensity: val, wavelength, channel: selectedChannel });
                  }
                }}
                className="flex-1"
                disabled={isLoading}
              >
                {val}%
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Off Button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => {
            turnOffIllumination({});
            setIsOn(false);
          }}
          disabled={isLoading || !isOn}
        >
          <Power className="h-4 w-4 mr-2" />
          Turn Off Illumination
        </Button>

        {/* Current State Display */}
        {illuminationState && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-muted-foreground">Intensity</div>
                <div className="font-mono font-medium">{illuminationState.intensity}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Wavelength</div>
                <div className="font-mono font-medium">{illuminationState.wavelength}nm</div>
              </div>
              <div>
                <div className="text-muted-foreground">Channel</div>
                <div className="font-mono font-medium">
                  {CHANNELS.find(c => c.id === illuminationState.channel)?.name ?? illuminationState.channel}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
