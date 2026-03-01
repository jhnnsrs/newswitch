import type { DichroicKubeStateSchema } from "@/hooks/states";
import { type z } from "zod";

type DichroicData = z.infer<typeof DichroicKubeStateSchema>;



export const DichroicKubePanel = ({ data }: { data: DichroicData }) => {
  

  return (
    <div>
        Dichroic Mirror
        {data.kube_id}


    </div>
  );
};