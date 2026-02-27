import { useCameraState, useExpanseState, useStageState, type ExpanseState } from '@/hooks/states';
import { Line, MapControls, OrthographicCamera, useContextBridge } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import JMuxer from 'jmuxer';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    CanvasTexture,
    DoubleSide,
    LinearFilter,
    Matrix4,
    Mesh,
    SRGBColorSpace,
    VideoTexture,
} from 'three';
import { useCurrentAffineTransform } from '../../hooks/useCurrentAffineTransform';
import { PanelContext, PanelProvider } from './PanelProvider';
import { PanelRenderer } from './panels/PanelRenderer';
import { StageBox } from './StageBox';
import { ActionButton } from '../ActionButton';
import { ClearExpanseDefinition } from '@/hooks/generated';
import { CircleArrowDown, RefreshCwIcon } from 'lucide-react';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type StreamStats = {
    bytesReceived: number;
    chunksReceived: number;
};

interface JMuxerOptions {
    node: HTMLVideoElement;
    mode: 'video';
    flushingTime?: number;
    fps?: number;
    debug?: boolean;
    clearBuffer?: boolean;
}

interface JMuxerInstance {
    feed(data: { video: Uint8Array }): void;
    destroy(): void;
}

const DEFAULT_VIDEO_WS = `${window.__agent_ws_url__ || import.meta.env.VITE_WEBSOCKET_URL}/video`;

const createCheckerboardTexture = (
    sizePx: number,
    cellsPerAxis: number,
    primary: string,
    secondary: string,
) => {
    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;

    const context = canvas.getContext('2d');
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

const useLiveVideoTexture = (
    url: string,
    setStats?: (stats: StreamStats) => void,
) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

    const socketRef = useRef<WebSocket | null>(null);
    const jmuxerRef = useRef<JMuxerInstance | null>(null);
    const statsRef = useRef<StreamStats>({ bytesReceived: 0, chunksReceived: 0 });

    const videoElement = useMemo(() => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        // Optimization for stream lag
        video.setAttribute('webkit-playsinline', 'webkit-playsinline');
        return video;
    }, []);

    const texture = useMemo(() => {
        const videoTexture = new VideoTexture(videoElement);
        videoTexture.colorSpace = SRGBColorSpace;
        videoTexture.magFilter = LinearFilter;
        videoTexture.minFilter = LinearFilter;
        videoTexture.generateMipmaps = false;
        return videoTexture;
    }, [videoElement]);

    useEffect(() => {
        try {
            jmuxerRef.current = new (JMuxer as any)({
                node: videoElement,
                mode: 'video',
                flushingTime: 0,
                fps: 30,
                debug: false,
                clearBuffer: true,
            });

            const socket = new WebSocket(url);
            socket.binaryType = 'arraybuffer';
            socketRef.current = socket;

            socket.onopen = () => setConnectionState('connected');
            socket.onmessage = (event: MessageEvent) => {
                const chunk = new Uint8Array(event.data as ArrayBuffer);
                statsRef.current = {
                    bytesReceived: statsRef.current.bytesReceived + chunk.byteLength,
                    chunksReceived: statsRef.current.chunksReceived + 1,
                };
                setStats?.({ ...statsRef.current });
                jmuxerRef.current?.feed({ video: chunk });
            };
            socket.onerror = () => setConnectionState('error');
            socket.onclose = () => setConnectionState('disconnected');
        } catch (error) {
            console.error('[Stage] Failed to initialize live stream', error);
        }

        return () => {
            socketRef.current?.close();
            jmuxerRef.current?.destroy();
            videoElement.pause();
            videoElement.src = "";
            videoElement.load();
        };
    }, [url, videoElement]); // Removed setStats to prevent loop if not memoized

    return { texture, connectionState };
};

const LivePlane = ({ matrix, texture }: { matrix: Matrix4, texture: VideoTexture }) => {
    const meshRef = useRef<Mesh>(null);

    // This is crucial: VideoTextures sometimes need manual 'needsUpdate' 
    // flags when the source is a JMuxer-fed video element.
    useFrame(() => {
        if (texture) texture.needsUpdate = true;
        if (meshRef.current) {
            meshRef.current.matrix.copy(matrix);
            meshRef.current.matrixWorldNeedsUpdate = true;
        }
    });

    return (
        <mesh ref={meshRef} matrixAutoUpdate={false}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial 
                map={texture} 
                side={DoubleSide} 
                transparent={true}
                toneMapped={false}
            />
        </mesh>
    );
};


const ImagePlane = ({ image }: { image: ExpanseState["current_images"][0] }) => {
    const meshRef = useRef<Mesh>(null);

    // This is crucial: VideoTextures sometimes need manual 'needsUpdate' 
    // flags when the source is a JMuxer-fed video element.

    return (
        <mesh ref={meshRef} matrixAutoUpdate={false}>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial 
                color={'#22c55e'} 
                side={DoubleSide} 
                transparent={true}
                opacity={0.5}
                toneMapped={false}
            />
        </mesh>
    );
};

const ScaleBar = ({ axis, lengthUm, position, color }: any) => {
    const size: [number, number, number] =
        axis === 'x' ? [lengthUm, 0.8, 0.8] :
        axis === 'y' ? [0.8, lengthUm, 0.8] : [0.8, 0.8, lengthUm];

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
            <ContextBridge>
                {children}
            </ContextBridge>
        </Canvas>
    );
}



export const Expanse = () => {
    const { data: stageState } = useStageState({ subscribe: true });
    const { data: expanseState } = useExpanseState({ subscribe: true });
    const { data: cameraState } = useCameraState({ subscribe: true });
    const affine = useCurrentAffineTransform();
    const [streamStats, setStreamStats] = useState<StreamStats>({ bytesReceived: 0, chunksReceived: 0 });

    const { texture: liveTexture, connectionState } = useLiveVideoTexture(DEFAULT_VIDEO_WS, (stats) => {
        setStreamStats(stats);
    });

    const stageMatrix = useMemo(() => {
        // Ensure we are reading the 4x4 array correctly. 
        // Matrix4.set is (n11, n12, n13, n14...)
        const m = new Matrix4();
        if (affine && affine.length === 4) {
            m.set(
                affine[0][0], affine[0][1], affine[0][2], affine[0][3],
                affine[1][0], affine[1][1], affine[1][2], affine[1][3],
                affine[2][0], affine[2][1], affine[2][2], affine[2][3],
                affine[3][0], affine[3][1], affine[3][2], affine[3][3]
            );
        }
        
        // Apply the 20um scale relative to the affine transform
        const liveTextureSizeUm = 20;
        const scaleM = new Matrix4().makeScale(liveTextureSizeUm, liveTextureSizeUm, 1);
        return m.multiply(scaleM);
    }, [affine]);

    const stageRangeX = Math.max(200, (stageState?.max_x ?? 100) - (stageState?.min_x ?? -100));
    const stageRangeY = Math.max(200, (stageState?.max_y ?? 100) - (stageState?.min_y ?? -100));


    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${['B', 'KB', 'MB', 'GB'][i]}`;
    };


    return (
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-black">
            <PanelProvider>
            <SceneWrapper>
                <color attach="background" args={['#020617']} />
                <ambientLight intensity={0.7} />
                <pointLight position={[100, 100, 100]} />
                <OrthographicCamera makeDefault zoom={1} position={[0, 0, 100]} near={0.1} far={1000} up={[0, 0, 1]} />

                {/* Grid Visuals */}
                <group>
                    <Line points={[[-stageRangeX / 2, 0, 0.1], [stageRangeX / 2, 0, 0.1]]} color="#ef4444" lineWidth={1} />
                    <Line points={[[0, -stageRangeY / 2, 0.1], [0, stageRangeY / 2, 0.1]]} color="#22c55e" lineWidth={1} />
                </group>


                <StageBox />

                
                <MapControls makeDefault enableZoom={true} enablePan={true} enableRotate={true} zoomSpeed={1} panSpeed={1} />

                {/* The Live Video Feed */}
                {cameraState?.is_acquiring && <LivePlane matrix={stageMatrix} texture={liveTexture} />}


                {expanseState?.current_images?.map((img) => <ImagePlane key={img.id} image={img} />)}


                <ScaleBar axis="x" lengthUm={20} position={[stageRangeX / 2 - 20, -stageRangeY / 2 + 10, 2]} color="#ef4444" />
                <ScaleBar axis="y" lengthUm={20} position={[stageRangeX / 2 - 30, -stageRangeY / 2 + 20, 2]} color="#22c55e" />
            </SceneWrapper>

            <PanelRenderer/>

            {/* UI Overlays */}
            <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/80 p-2 text-[10px] text-white">
                <div className={connectionState === 'connected' ? 'text-green-400' : 'text-red-400'}>
                    STATUS: {connectionState.toUpperCase()}
                </div>
                <div>DATA: {formatBytes(streamStats.bytesReceived)}</div>
            </div>
            
            <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/80 p-2 font-mono text-[10px] text-white">
                POS: X {(stageState?.x ?? 0).toFixed(2)} Y {(stageState?.y ?? 0).toFixed(2)} Z {(stageState?.z ?? 0).toFixed(2)}
            </div>
            <div className=" absolute bottom-2 right-2 rounded bg-black/80 p-2 font-mono text-[10px] text-white">
                {expanseState?.current_images?.length ?? 0} IMAGES <ActionButton action={ClearExpanseDefinition} args={{}} size={"icon-xs"} variant={"outline"}><RefreshCwIcon/></ActionButton>
            </div>
            </PanelProvider>
        </div>
    );
};