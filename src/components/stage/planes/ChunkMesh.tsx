import { useViewerStore } from '@/store/viewerStore';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { open } from 'zarrita'; 
import type { ChunkData } from '../stores/types';

// --- Helper: Memory-Efficient Texture Configuration ---
function getTextureConfig(rawData: any) {
  if (rawData instanceof Uint8Array || rawData instanceof Uint8ClampedArray) {
    // 8-bit integer
    return { 
      data: rawData, 
      type: THREE.UnsignedByteType, 
      internalFormat: 'R8', 
      dataScale: 255.0 
    };
  }
  if (rawData instanceof Uint16Array) {
    // 16-bit unsigned integer
    return { 
      data: rawData, 
      type: THREE.UnsignedShortType, 
      internalFormat: 'R16', 
      dataScale: 65535.0 
    };
  }
  if (rawData instanceof Float32Array) {
    // 32-bit float
    return { 
      data: rawData, 
      type: THREE.FloatType, 
      internalFormat: 'R32F', 
      dataScale: 1.0 
    };
  }
  
  // Fallback: If it's a signed int (Int16Array), 64-bit float, or unknown, promote it to Float32.
  // This incurs a memory penalty but guarantees rendering for exotic formats without crashing.
  console.warn("Promoting TypedArray to Float32Array for WebGL compatibility.");
  let floatData = new Float32Array(rawData);
  return { 
    data: floatData, 
    type: THREE.FloatType, 
    internalFormat: 'R32F', 
    dataScale: 1.0 
  };
}

// --- 1. Individual Chunk Renderer with Shader ---
export const ChunkMesh = ({ chunk }: { chunk: ChunkData }) => {
  const [texture, setTexture] = useState<THREE.DataTexture | null>(null);
  const [dataScale, setDataScale] = useState<number>(1.0);

  const zSlice = useViewerStore((s) => s.zStart);
  const tStart = useViewerStore((s) => s.tStart);
  const tEnd = useViewerStore((s) => s.tEnd);

  const chunkZSize = chunk.chunk_shape[0];
  const chunkHeight = chunk.chunk_shape[1];
  const chunkWidth = chunk.chunk_shape[2];

  // 1. Culling Logic
  const isVisible = useMemo(() => {
    const zStart = chunk.z_index * chunkZSize;
    const zEnd = zStart + chunkZSize;
    const zVisible = zSlice === null || (zStart <= zSlice && zEnd > zSlice);

    let tVisible = true;
    if (tStart !== null && tEnd !== null && chunk.metadata?.acquisition_time) {
      const acqTime = new Date(chunk.metadata.acquisition_time).getTime();
      const startTime = new Date(tStart).getTime();
      const endTime = new Date(tEnd).getTime();
      tVisible = acqTime >= startTime && acqTime <= endTime;
    }

    return zVisible && tVisible;
  }, [chunk, zSlice, tStart, tEnd, chunkZSize]);

  const [, yIdx, xIdx] = chunk.chunk_coord.split(',').map(Number);

  // 2. Data Fetching & Texture Mapping
  useEffect(() => {
    if (!isVisible) return; 

    let isMounted = true;
    const loadData = async () => {
      try {
        const arr = await open.v3(chunk.store, { kind: "array" });
        const chunkData = await arr.getChunk([chunk.z_index, yIdx, xIdx]);

        if (!isMounted || !chunkData) return;

        // Apply our helper to safely map types and get the correct internal format
        const { data, type, internalFormat, dataScale } = getTextureConfig(chunkData.data);

        const tex = new THREE.DataTexture(
          data,
          chunkWidth,
          chunkHeight,
          THREE.RedFormat,
          type
        );
        
        // FIX: Explicitly assign the sized internal format to prevent WebGL "Invalid enum RED" crashes
        tex.internalFormat = internalFormat as any;
        
        // Settings for smooth zooming and exact pixel mapping
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.flipY = false; 
        tex.needsUpdate = true;
        
        setDataScale(dataScale);
        setTexture(tex);
      } catch (error) {
        console.error(`Failed to load chunk: ${chunk.chunk_key}`, error);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [chunk, isVisible, chunkWidth, chunkHeight, yIdx, xIdx]);

  // 3. Cleanup
  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  if (!isVisible) return null;

  const xPos = xIdx * chunkWidth + chunkWidth / 2;
  const yPos = -(yIdx * chunkHeight) - chunkHeight / 2;

  if (!texture) {
    return (
      <mesh position={[xPos, yPos, 0]}>
        <planeGeometry args={[chunkWidth, chunkHeight]} />
        <meshBasicMaterial color="gray" wireframe={true} />
      </mesh>
    );
  }

  return (
    <group position={[xPos, yPos, 0]}>
      <mesh renderOrder={1}>
        <planeGeometry args={[chunkWidth, chunkHeight]} />
        <shaderMaterial
          transparent={false}
          blending={THREE.AdditiveBlending}
          depthWrite={true}
          depthTest={true}
          uniforms={{
            colorTexture: { value: texture },
            colormapTexture: { value: chunk.colormapTexture ?? null },
            minValue: { value: chunk.min_value ?? 0 },
            maxValue: { value: chunk.max_value ?? 255 },
            opacity: { value: 1.0 }, 
            gamma: { value: 1.0 },   
            useDiscrete: { value: 0.0 },
            dataScale: { value: dataScale },
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform sampler2D colorTexture;
            uniform sampler2D colormapTexture;
            uniform float minValue;
            uniform float maxValue;
            uniform float opacity;
            uniform float gamma;
            uniform float useDiscrete;
            uniform float dataScale; 
            varying vec2 vUv;

            void main() {
              vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
              float value = texture2D(colorTexture, flippedUv).r;

              // Scale the normalized WebGL value back to its raw scientific value
              float rawValue = value * dataScale;

              float normalized;
              if (useDiscrete > 0.5) {
                normalized = mod(rawValue, 256.0) / 255.0;
              } else {
                normalized = clamp((rawValue - minValue) / (maxValue - minValue), 0.0, 0.999);
                normalized = pow(normalized, gamma);
              }

              vec4 color = texture2D(colormapTexture, vec2(normalized, 0.5)).rgba;
              gl_FragColor = vec4(color.rgb, color.a * opacity);
            }
          `}
        />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[chunkWidth, chunkHeight]} />
        <meshBasicMaterial color="cyan" wireframe={true} opacity={0.3} transparent={true} />
      </mesh>
    </group>
  );
};