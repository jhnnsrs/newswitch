import {
    useCameraState,
    useStageState
} from "@/hooks/states";
import {
    Line,
    useContextBridge
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
    CanvasTexture,
    LinearFilter,
    SRGBColorSpace
} from "three";
import { CameraMatrixSync } from "./CameraMatrixSync";
import { CameraController } from "./cameras/CameraController";
import { KeyboardModeController } from "./controllers/KeyboardModeController";
import { RectangleDrawer } from "./interactions/RectangleDrawer";
import { StagePositioner } from "./interactions/StagePositioner";
import { SceneOverlay } from "./overlays/SceneOverlay";
import { PanelContext, PanelProvider } from "./PanelProvider";
import { ScanRegionPanel } from "./panels/ScanRegionPanel";
import { ImagesPlane } from "./planes/ImagesPlane";
import { LivePlane } from "./planes/LivePlane";
import { StagePlane } from "./planes/StagePlane";
import { ImageMetadataPanel } from "./panels/ImageMetadata";
import { CurrentImageLightPathPlane } from "./planes/LightPathStatePlane";



const DEFAULT_VIDEO_WS = `${window.__agent_ws_url__ || import.meta.env.VITE_WEBSOCKET_URL}/video`;

const createCheckerboardTexture = (
  sizePx: number,
  cellsPerAxis: number,
  primary: string,
  secondary: string,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const cellSize = sizePx / cellsPerAxis;
  for (let row = 0; row < cellsPerAxis; row += 1) {
    for (let col = 0; col < cellsPerAxis; col += 1) {
      context.fillStyle = (row + col) % 2 === 0 ? primary : secondary;
      context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  return texture;
};



const ScaleBar = ({ axis, lengthUm, position, color }: any) => {
  const size: [number, number, number] =
    axis === "x"
      ? [lengthUm, 0.8, 0.8]
      : axis === "y"
        ? [0.8, lengthUm, 0.8]
        : [0.8, 0.8, lengthUm];

  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} toneMapped={false} />
    </mesh>
  );
};

export const SceneWrapper = ({ children }) => {
  const ContextBridge = useContextBridge(PanelContext);
  return (
    <Canvas>
      <ContextBridge>{children}</ContextBridge>
    </Canvas>
  );
};

export const Expanse = () => {
  const { data: stageState } = useStageState({ subscribe: true });
  const { data: cameraState } = useCameraState({ subscribe: true });
  

  const stageRangeX = Math.max(
    200,
    (stageState?.max_x ?? 100) - (stageState?.min_x ?? -100),
  );
  const stageRangeY = Math.max(
    200,
    (stageState?.max_y ?? 100) - (stageState?.min_y ?? -100),
  );

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${["B", "KB", "MB", "GB"][i]}`;
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-black">
      <PanelProvider>
        <KeyboardModeController />
        <SceneWrapper>
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.7} />
          <pointLight position={[100, 100, 100]} />
          <CameraMatrixSync />

          {/* Grid Visuals */}
          <group>
            <Line
              points={[
                [-stageRangeX / 2, 0, 0.1],
                [stageRangeX / 2, 0, 0.1],
              ]}
              color="#ef4444"
              lineWidth={1}
            />
            <Line
              points={[
                [0, -stageRangeY / 2, 0.1],
                [0, stageRangeY / 2, 0.1],
              ]}
              color="#22c55e"
              lineWidth={1}
            />
          </group>

          <CurrentImageLightPathPlane />

          <StagePlane />

          <CameraController />

          {/* The Live Video Feed */}
          {cameraState?.is_acquiring && (
            <LivePlane />
          )}

          <ImagesPlane />

          <ScaleBar
            axis="x"
            lengthUm={20}
            position={[stageRangeX / 2 - 20, -stageRangeY / 2 + 10, 2]}
            color="#ef4444"
          />
          <ScaleBar
            axis="y"
            lengthUm={20}
            position={[stageRangeX / 2 - 30, -stageRangeY / 2 + 20, 2]}
            color="#22c55e"
          />
          <StagePositioner/>
          <RectangleDrawer />
        </SceneWrapper>

        <ScanRegionPanel />
        <ImageMetadataPanel />

        <SceneOverlay />
      </PanelProvider>
    </div>
  );
};
