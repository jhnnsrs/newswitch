import { useViewerStore } from '@/store/viewerStore';
import { open } from 'zarrita';
import type { AbsolutePath } from '@zarrita/storage';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { Frame } from '../hooks/zarr/types';
import type { ChunkData } from '../stores/types';
import { mapDTypeToMinMax } from '../stores/utils';
import { ChunkMesh } from './ChunkMesh';
import { redColormap } from '../hooks/zarr/colormaps';


// --- 2. The Main Frame Plane ---

export const FrameVolume = ({ frame }: { frame: Frame }) => {
  const [chunks, setChunks] = useState<ChunkData[] | null>(null);

  const storeBuilder = useViewerStore((s) => s.storeBuilder);

  useEffect(() => {
    let isMounted = true;

    const initializeZarr = async () => {
      try {
        const store = storeBuilder(frame);
        const arr = await open.v3(store, { kind: "array" });

        if (!isMounted) return;
        console.log(`Initialized Zarr for Frame ${frame.id}: shape=${arr.shape}, dtype=${arr.dtype}`);

        const shape = arr.shape;
        const dtype = arr.dtype;
        const chunk_shape = arr.chunks;

        const [min_val, max_val] = mapDTypeToMinMax(dtype);

        // Explicitly map the 3D shape (Z, Y, X)
        const [zDim, yDim, xDim] = shape;
        const [zChunk, yChunk, xChunk] = chunk_shape;

        const generatedChunks: ChunkData[] = [];

        let colormapTexture = redColormap;

        for (let z = 0; z < Math.ceil(zDim / zChunk); z++) {
          for (let y = 0; y < Math.ceil(yDim / yChunk); y++) {
            for (let x = 0; x < Math.ceil(xDim / xChunk); x++) {
              generatedChunks.push({
                frame_id: frame.id,
                store: store,
                chunk_coord: `${z},${y},${x}`,
                chunk_key: `/c/${z}/${y}/${x}` as AbsolutePath,
                chunk_shape: [zChunk, yChunk, xChunk],
                z_index: z,
                min_value: frame.metadata.min_value ?? min_val,
                max_value: frame.metadata.max_value ?? max_val,
                metadata: frame.metadata,
                colormapTexture: colormapTexture
              });
            }
          }
        }

        setChunks(generatedChunks);
      } catch (error) {
        console.error(`Failed to initialize Frame: ${frame.id}`, error);
      }
    };

    initializeZarr();

    return () => {
      isMounted = false;
    };
  }, [frame, storeBuilder]);

  // Extract Affine Matrix from metadata
  const affineMatrix = useMemo(() => {
    const mat = new THREE.Matrix4();
    if (!frame.metadata.affine_matrix) return mat;
    
    const rawMat = frame.metadata.affine_matrix;
    if (rawMat.length === 3) {
      mat.set(
        rawMat[0][0], rawMat[0][1], 0, rawMat[0][2],
        rawMat[1][0], rawMat[1][1], 0, rawMat[1][2],
        0, 0, 1, 0,
        rawMat[2][0], rawMat[2][1], 0, rawMat[2][2]
      );
    } else if (rawMat.length === 4) {
      mat.set(
        rawMat[0][0], rawMat[0][1], rawMat[0][2], rawMat[0][3],
        rawMat[1][0], rawMat[1][1], rawMat[1][2], rawMat[1][3],
        rawMat[2][0], rawMat[2][1], rawMat[2][2], rawMat[2][3],
        rawMat[3][0], rawMat[3][1], rawMat[3][2], rawMat[3][3]
      );
    }
    return mat;
  }, [frame]);

  if (!chunks) {
    return null; 
  }

  return (
    <group matrix={affineMatrix} matrixAutoUpdate={false}>
      {chunks.map((chunk) => (
        <ChunkMesh key={chunk.chunk_key} chunk={chunk} />
      ))}
    </group>
  );
};