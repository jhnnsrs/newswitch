import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useChunkData } from '../hooks/zarr/useChunkData';
import { type ChunkRender } from '../stores/cacheStore';



// --- 2. Individual Chunk Renderer ---

export const ChunkMesh = ({ chunk }: { chunk: ChunkRender }) => {
  // This will SUSPEND the component until the Zarrita store returns the data
  const rawData = useChunkData(chunk);

  // Assuming 4D shape [T, Z, Y, X]. Extract Y and X for the 2D plane.
  const chunkHeight = chunk.chunk_shape[2]; // Y dimension
  const chunkWidth = chunk.chunk_shape[3];  // X dimension

  const texture = useMemo(() => {
    if (!rawData) return null;

    // Create a Three.js DataTexture from the raw Uint8Array
    // Note: If your data is Float32, change the format and typed array accordingly
    const tex = new THREE.DataTexture(
      rawData,
      chunkWidth,
      chunkHeight,
      THREE.RedFormat, // Assuming single-channel grayscale data
      THREE.UnsignedByteType
    );
    
    // Zarr data is usually top-to-bottom, Three.js is bottom-to-top
    tex.flipY = true;
    tex.needsUpdate = true;
    return tex;
  }, [rawData, chunkWidth, chunkHeight]);

  // Clean up WebGL memory when chunk unmounts (e.g., when sliced out of view)
  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  if (!texture) return null;

  // Extract spatial coordinates from the chunk string "t,z,y,x"
  const [, , yIdx, xIdx] = chunk.chunk_coord.split(',').map(Number);

  // Calculate physical position in the 3D scene
  // We center the mesh based on its index and size
  const xPos = xIdx * chunkWidth + (chunkWidth / 2);
  const yPos = -(yIdx * chunkHeight + (chunkHeight / 2)); // Negative so Y goes down

  return (
    <mesh position={[xPos, yPos, 0]}>
      <planeGeometry args={[chunkWidth, chunkHeight]} />
      <meshBasicMaterial 
        map={texture} 
        color="white" 
        side={THREE.DoubleSide} 
        transparent={true}
      />
    </mesh>
  );
};