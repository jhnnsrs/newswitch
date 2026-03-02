import { useCameraState } from "@/hooks/states";
import { useKubeStateStore } from "@/store/kubeStateStore";
import { Canvas } from "@react-three/fiber";
import { CameraMatrixSync } from "./CameraMatrixSync";
import { CameraController } from "./cameras/CameraController";
import { KeyboardModeController } from "./controllers/KeyboardModeController";
import { RectangleDrawer } from "./interactions/RectangleDrawer";
import { StagePositioner } from "./interactions/StagePositioner";
import { SceneOverlay } from "./overlays/SceneOverlay";
import { TimeOverlay } from "./overlays/TimeOverla";
import { PanelProvider } from "./PanelProvider";
import { ImageMetadataPanel } from "./panels/ImageMetadata";
import { KubeStatePanel } from "./panels/KubeStatePanel";
import { ScanRegionPanel } from "./panels/ScanRegionPanel";
import { ImagesPlane } from "./planes/ImagesPlane";
import { CurrentImageLightPathPlane } from "./planes/LightPathStatePlane";
import { LivePlane } from "./planes/LivePlane";
import { StageAxis } from "./planes/StageAxis";
import { StagePlane } from "./planes/StagePlane";

export const SceneWrapper = ({ children }) => {
  const selectedKubeState = useKubeStateStore((s) => s.selectedKubeState);
  const hasSelection = selectedKubeState !== null;
  return <Canvas>{children}</Canvas>;
};

export const Expanse = () => {
  const { data: cameraState } = useCameraState({ subscribe: true });

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-black">
      <PanelProvider>
        <KeyboardModeController />
        <SceneWrapper>
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.7} />
          <pointLight position={[100, 100, 100]} />
          <CameraMatrixSync />

          <CurrentImageLightPathPlane />

          <StageAxis />

          <StagePlane />

          <CameraController />

          {/* The Live Video Feed */}
          {cameraState?.is_acquiring && <LivePlane />}

          <ImagesPlane />

          <StagePositioner />
          <RectangleDrawer />
        </SceneWrapper>

        <ScanRegionPanel />
        <ImageMetadataPanel />
        <KubeStatePanel />

        <SceneOverlay />
        <TimeOverlay />
      </PanelProvider>
    </div>
  );
};
