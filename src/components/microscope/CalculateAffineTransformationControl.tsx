import { ActionButton } from "@/components/ActionButton";
import { CalculateCurrentAffineMatrixDefinition } from "@/hooks/generated";
import { useCalibrationState } from "@/hooks/states";
import { ArrowUp } from "lucide-react";
import { Card } from "../ui/card";

export const CalculateAffineTransformationControl = () => {
  const { data } = useCalibrationState({ subscribe: true });

  return (
    <div className="flex justify-center">
        <ActionButton
          action={CalculateCurrentAffineMatrixDefinition}
          args={{}}
          variant="outline"
          size="xs"
        >
          Calculate Pixel Sizes
        </ActionButton>
    </div>
  );
};
