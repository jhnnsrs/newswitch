import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSwitchFilter, useToggleFilter } from '@/hooks/generated';
import { useFilterBankState } from '@/hooks/states';
import { cn } from '@/lib/utils';
import { Filter, RotateCw } from 'lucide-react';
import { ResponsiveGrid } from '../ui/responsive-grid';

// Color mapping for filter wavelengths
const getWavelengthColor = (wavelength: number): string => {
  if (wavelength < 420) return 'bg-violet-500';
  if (wavelength < 500) return 'bg-blue-500';
  if (wavelength < 570) return 'bg-green-500';
  if (wavelength < 600) return 'bg-yellow-500';
  if (wavelength < 650) return 'bg-orange-500';
  return 'bg-red-500';
};

const getWavelengthTextColor = (wavelength: number): string => {
  if (wavelength < 420) return 'text-violet-400';
  if (wavelength < 500) return 'text-blue-400';
  if (wavelength < 570) return 'text-green-400';
  if (wavelength < 600) return 'text-yellow-400';
  if (wavelength < 650) return 'text-orange-400';
  return 'text-red-400';
};

export function FilterBankControl() {
  const { data: filterBankState, loading: stateLoading } = useFilterBankState({
    subscribe: true,
  });
  const { assign: switchFilter, isLoading: isSwitching } = useSwitchFilter();
  const { assign: toggleFilter, isLoading: isToggling } = useToggleFilter();

  const filters = filterBankState?.filters ?? [];
  const currentSlot = filterBankState?.current_slot;
  const activeFilter = filters.find((f) => f.slot === currentSlot);

  const handleSelectFilter = (slot: number) => {
    if (slot !== currentSlot) {
      switchFilter({ slot });
    }
  };

  const handleToggle = () => {
    toggleFilter({});
  };

  const isLoading = isSwitching || isToggling;

  return (
    <div className="space-y-4">

      {/* Filters */}
      <ResponsiveGrid>
        {filters.map((filter) => {
          const isActive = filter.slot === currentSlot;

          return (
            <div
              key={filter.slot}
              className={cn(
                'p-3 rounded-lg border transition-all cursor-pointer',
                isActive
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-muted/30 border-transparent hover:bg-muted/50',
              )}
              onClick={() => handleSelectFilter(filter.slot)}
            >
              {/* Filter Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full',
                            getWavelengthColor(filter.center_wavelength),
                            isActive && 'animate-pulse',
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{filter.center_wavelength}nm</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-sm font-medium">{filter.name}</span>
                  <span
                    className={cn(
                      'text-xs font-mono',
                      getWavelengthTextColor(filter.center_wavelength),
                    )}
                  >
                    {filter.center_wavelength}nm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => handleSelectFilter(filter.slot)}
                    disabled={isLoading}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Filter Details */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground">
                  BW: {filter.bandwidth}nm
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  T: {(filter.transmission * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  Slot {filter.slot}
                </span>
              </div>
            </div>
          );
        })}

        {(!filters || filters.length === 0) && !stateLoading && (
          <div className="text-center py-4 text-sm text-muted-foreground col-span-full">
            No filters available
          </div>
        )}
      </ResponsiveGrid>

      {/* Quick Toggle Button */}
      {filters.length > 1 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleToggle}
          disabled={isLoading}
        >
          <RotateCw className={cn('h-4 w-4', isToggling && 'animate-spin')} />
          Cycle to Next Filter
        </Button>
      )}
    </div>
  );
}
