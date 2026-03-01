import type { LightPathState } from "@/components/lightpath/LightPathStateRender";
import { Suspense } from "react";
import { useSelectedImage } from "../hooks/useSelectedImage";
import { DetectorKubePlane } from "./kubes/DetectorKubePlane";
import { ObjectiveKubePlane } from "./kubes/ObjectiveKubePlane";
import { FilterKubePlane } from "./kubes/FilterKubePlane";
import { IlluminationKubePlane } from "./kubes/IlluminationKubePlane";
import { StageKubePlane } from "./kubes/StageKubePlane";
import { DichroicKubePlane } from "./kubes/DichroicKube";


export const LightPathStatePlane = ({ path }: { path: LightPathState }) => {

  return (
    <>
    {path.kubes.map((kube, idx) => (
      <Suspense key={kube.kube_id} fallback={<></>}>
        {(() => {
          switch (kube.__brand) {
            case "objective_kube_state":
              return <ObjectiveKubePlane data={kube} />;
            case "detector_kube_state":
              return <DetectorKubePlane data={kube} />;
            case "filter_kube_state":
              return <FilterKubePlane data={kube} />;
            case "illumination_kube_state":
              return <IlluminationKubePlane data={kube} />;
            case "stage_kube_state":
              return <StageKubePlane data={kube} />;
            case "dichroic_kube_state":
              return <DichroicKubePlane data={kube} />;
            case "generic_kube_state":
              return null; // We don't have a specific plane for generic kubes, so we skip rendering.
            default:
              return null;
          }
        })()}
      </Suspense>
    ))}
    </>
  );
}
      



export const CurrentImageLightPathPlane = () => {
  const selectedImage = useSelectedImage();
  
   return   <Suspense fallback={<></>}>
            {selectedImage?.metadata?.light_state && (
                <LightPathStatePlane path={selectedImage.metadata.light_state} />
            )}
          </Suspense>
};