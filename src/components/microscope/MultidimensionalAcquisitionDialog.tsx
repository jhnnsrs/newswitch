import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useAcquireMultidimensionalAcquisition,
  type MultidimensionalAcquisition,
  type Position,
  type Stack,
  type Streams,
} from '@/hooks/generated';
import { Grid3X3, Plus, Trash2, Play, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PositionFormData {
  x: number;
  y: number;
  z: number;
  zOffset: number;
  zStep: number;
  zSlices: number[];
  channels: Streams[];
}

const defaultChannel: Streams = {
  detector: 'camera_1',
  mapping: 'default',
};

const defaultPosition: PositionFormData = {
  x: 0,
  y: 0,
  z: 0,
  zOffset: 0,
  zStep: 1,
  zSlices: [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
  channels: [defaultChannel],
};

export function MultidimensionalAcquisitionDialog() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('acquisition_001');
  const [fileFormat, setFileFormat] = useState('tiff');
  const [positions, setPositions] = useState<PositionFormData[]>([{ ...defaultPosition }]);

  const {
    assign: startAcquisition,
    isLoading,
    task,
    progress,
    cancel,
  } = useAcquireMultidimensionalAcquisition();

  const addPosition = () => {
    setPositions([...positions, { ...defaultPosition }]);
  };

  const removePosition = (index: number) => {
    if (positions.length > 1) {
      setPositions(positions.filter((_, i) => i !== index));
    }
  };

  const updatePosition = (index: number, field: keyof PositionFormData, value: number | number[] | Streams[]) => {
    const updated = [...positions];
    updated[index] = { ...updated[index], [field]: value };
    setPositions(updated);
  };

  const addChannel = (posIndex: number) => {
    const updated = [...positions];
    updated[posIndex].channels = [...updated[posIndex].channels, { ...defaultChannel }];
    setPositions(updated);
  };

  const removeChannel = (posIndex: number, channelIndex: number) => {
    const updated = [...positions];
    if (updated[posIndex].channels.length > 1) {
      updated[posIndex].channels = updated[posIndex].channels.filter((_, i) => i !== channelIndex);
      setPositions(updated);
    }
  };

  const updateChannel = (posIndex: number, channelIndex: number, field: keyof Streams, value: string) => {
    const updated = [...positions];
    updated[posIndex].channels[channelIndex] = {
      ...updated[posIndex].channels[channelIndex],
      [field]: value,
    };
    setPositions(updated);
  };

  const buildConfig = (): MultidimensionalAcquisition => {
    const builtPositions: Position[] = positions.map((pos) => {
      const stack: Stack = {
        z_offset: pos.zOffset,
        z_step: pos.zStep,
        z_slices: pos.zSlices,
        channels: pos.channels,
      };
      return {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        stacks: [stack],
      };
    });

    return {
      timepoints: {
        time: new Date().toISOString(),
        positions: builtPositions,
        position_order: 'sequential',
      },
      file_name: fileName,
      file_format: fileFormat,
    };
  };

  const handleStart = () => {
    const config = buildConfig();
    startAcquisition({ config }, { notify: true });
  };

  const handleCancel = () => {
    if (task?.id) {
      cancel();
    }
  };

  const parseZSlices = (value: string): number[] => {
    return value
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-14 justify-start">
          <Grid3X3 className="h-5 w-5 mr-3" />
          <div className="flex-1 text-left">
            <div className="font-medium">Multidimensional Acquisition</div>
            <div className="text-xs text-muted-foreground">Configure XYZ + channels + time</div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Multidimensional Acquisition
          </DialogTitle>
          <DialogDescription>
            Configure positions, z-stacks, and channels for acquisition
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="acquisition_001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileFormat">File Format</Label>
              <Input
                id="fileFormat"
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value)}
                placeholder="tiff"
              />
            </div>
          </div>

          {/* Positions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Positions</Label>
              <Button variant="outline" size="sm" onClick={addPosition}>
                <Plus className="h-4 w-4 mr-1" />
                Add Position
              </Button>
            </div>

            {positions.map((pos, posIndex) => (
              <Card key={posIndex} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Position {posIndex + 1}</CardTitle>
                    {positions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removePosition(posIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* XYZ Coordinates */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">X (µm)</Label>
                      <Input
                        type="number"
                        value={pos.x}
                        onChange={(e) => updatePosition(posIndex, 'x', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Y (µm)</Label>
                      <Input
                        type="number"
                        value={pos.y}
                        onChange={(e) => updatePosition(posIndex, 'y', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Z (µm)</Label>
                      <Input
                        type="number"
                        value={pos.z}
                        onChange={(e) => updatePosition(posIndex, 'z', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* Z-Stack Settings */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Z Offset</Label>
                      <Input
                        type="number"
                        value={pos.zOffset}
                        onChange={(e) => updatePosition(posIndex, 'zOffset', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Z Step</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={pos.zStep}
                        onChange={(e) => updatePosition(posIndex, 'zStep', parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Z Slices (comma-sep)</Label>
                      <Input
                        value={pos.zSlices.join(', ')}
                        onChange={(e) => updatePosition(posIndex, 'zSlices', parseZSlices(e.target.value))}
                        placeholder="-5, -2, 0, 2, 5"
                      />
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Channels</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => addChannel(posIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    {pos.channels.map((channel, channelIndex) => (
                      <div key={channelIndex} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Detector</Label>
                          <Input
                            value={channel.detector}
                            onChange={(e) => updateChannel(posIndex, channelIndex, 'detector', e.target.value)}
                            placeholder="camera_1"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Mapping</Label>
                          <Input
                            value={channel.mapping}
                            onChange={(e) => updateChannel(posIndex, channelIndex, 'mapping', e.target.value)}
                            placeholder="default"
                          />
                        </div>
                        {pos.channels.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => removeChannel(posIndex, channelIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress */}
          {isLoading && progress !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Acquisition Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Task Status */}
          {task && (
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <span className="text-sm">Status</span>
              <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                {task.status}
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isLoading ? (
            <Button variant="destructive" onClick={handleCancel}>
              <Square className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />
              Start Acquisition
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
