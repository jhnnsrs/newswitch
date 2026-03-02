import { useCurrentAffineTransform } from "@/hooks/useCurrentAffineTransform";
import { useFrame } from "@react-three/fiber";
import JMuxer from "jmuxer";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DoubleSide,
  LinearFilter,
  Matrix4,
  Mesh,
  SRGBColorSpace,
  VideoTexture,
} from "three";

const DEFAULT_VIDEO_WS = `${window.__agent_ws_url__ || import.meta.env.VITE_WEBSOCKET_URL}/video`;

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

type StreamStats = {
  bytesReceived: number;
  chunksReceived: number;
};

interface JMuxerOptions {
  node: HTMLVideoElement;
  mode: "video";
  flushingTime?: number;
  fps?: number;
  debug?: boolean;
  clearBuffer?: boolean;
}

interface JMuxerInstance {
  feed(data: { video: Uint8Array }): void;
  destroy(): void;
}

const useLiveVideoTexture = (
  url: string = DEFAULT_VIDEO_WS,
  setStats?: (stats: StreamStats) => void,
) => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  const socketRef = useRef<WebSocket | null>(null);
  const jmuxerRef = useRef<JMuxerInstance | null>(null);
  const statsRef = useRef<StreamStats>({ bytesReceived: 0, chunksReceived: 0 });

  const videoElement = useMemo(() => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    // Optimization for stream lag
    video.setAttribute("webkit-playsinline", "webkit-playsinline");
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
        mode: "video",
        flushingTime: 0,
        fps: 30,
        debug: false,
        clearBuffer: true,
      });

      const socket = new WebSocket(url);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      socket.onopen = () => setConnectionState("connected");
      socket.onmessage = (event: MessageEvent) => {
        const chunk = new Uint8Array(event.data as ArrayBuffer);
        statsRef.current = {
          bytesReceived: statsRef.current.bytesReceived + chunk.byteLength,
          chunksReceived: statsRef.current.chunksReceived + 1,
        };
        setStats?.({ ...statsRef.current });
        jmuxerRef.current?.feed({ video: chunk });
      };
      socket.onerror = () => setConnectionState("error");
      socket.onclose = () => setConnectionState("disconnected");
    } catch (error) {
      console.error("[Stage] Failed to initialize live stream", error);
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

export const LivePlane = () => {
  const meshRef = useRef<Mesh>(null);

  const { texture: liveTexture } = useLiveVideoTexture(
    DEFAULT_VIDEO_WS,
    () => {},
  );
  const affine = useCurrentAffineTransform();

  const stageMatrix = useMemo(() => {
    // Ensure we are reading the 4x4 array correctly.
    // Matrix4.set is (n11, n12, n13, n14...)
    const m = new Matrix4();
    if (affine && affine.length === 4) {
      m.set(
        affine[0][0],
        affine[0][1],
        affine[0][2],
        affine[0][3],
        affine[1][0],
        affine[1][1],
        affine[1][2],
        affine[1][3],
        affine[2][0],
        affine[2][1],
        affine[2][2],
        affine[2][3],
        affine[3][0],
        affine[3][1],
        affine[3][2],
        affine[3][3],
      );
    }

    // Apply the 20um scale relative to the affine transform
    const liveTextureSizeUm = 20;
    const scaleM = new Matrix4().makeScale(
      liveTextureSizeUm,
      liveTextureSizeUm,
      1,
    );
    return m.multiply(scaleM);
  }, [affine]);

  // This is crucial: VideoTextures sometimes need manual 'needsUpdate'
  // flags when the source is a JMuxer-fed video element.
  useFrame(() => {
    if (liveTexture) liveTexture.needsUpdate = true;
    if (meshRef.current) {
      meshRef.current.matrix.copy(stageMatrix);
      meshRef.current.matrixWorldNeedsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} matrixAutoUpdate={false}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={liveTexture}
        side={DoubleSide}
        transparent={true}
        toneMapped={false}
      />
    </mesh>
  );
};
