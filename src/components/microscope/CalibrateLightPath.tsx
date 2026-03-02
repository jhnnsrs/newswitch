import { ActionButton } from "@/components/ActionButton";
import { CalibrateLightPathDefinition } from "@/hooks/generated";
import { useCalibrationState } from "@/hooks/states";

export const CalibrateLightPath = () => {
  const { data } = useCalibrationState({ subscribe: true });

  return (
    <div className="flex justify-center">
      <ActionButton
        action={CalibrateLightPathDefinition}
        args={{}}
        variant="outline"
        size="xs"
      >
        Calculate Pixel Sizes
      </ActionButton>
    </div>
  );
};
