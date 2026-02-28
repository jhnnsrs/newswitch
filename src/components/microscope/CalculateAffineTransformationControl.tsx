import { ActionButton } from "@/components/ActionButton";
import { CalculateCurrentAffineMatrixDefinition } from "@/hooks/generated";
import { useCalibrationState } from "@/hooks/states";
import { ArrowUp } from "lucide-react";
import { Card } from "../ui/card";

export const CalculateAffineTransformationControl = () => {
  const { data } = useCalibrationState({ subscribe: true });

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-1">
        <div />
        <ActionButton
          action={CalculateCurrentAffineMatrixDefinition}
          args={{}}
          variant="outline"
          size="icon"
          className="h-10 w-10"
        >
          <ArrowUp className="h-5 w-5" />
        </ActionButton>
      </div>
      {data?.affine_states?.map((s) => (
        <Card>
          <div className="text-sm font-medium">
            Objective {s.objective_slot}
          </div>
          <div className="text-xs text-muted-foreground">
            Camera {s.detector_slot}
          </div>
          <pre>{JSON.stringify(s.affine_matrix, null, 2)}</pre>
        </Card>
      ))}
    </div>
  );
};
