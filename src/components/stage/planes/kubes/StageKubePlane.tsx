import type { StageKubeStateSchema } from "@/hooks/states";
import { type z } from "zod";
import { useThreeAffine } from "./useThreeAffine";

type StageKubeData = z.infer<typeof StageKubeStateSchema>;

export const StageKubePlane = ({ data }: { data: StageKubeData }) => {
  // We use a group to hold the stacked cylinder parts together.
  // The entire group is positioned at the state coordinates.
  const matrix = useThreeAffine(data.affine_matrix);
  
  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      

    </group>
  );
};