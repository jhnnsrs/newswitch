import { Suspense } from "react";
import { useCacheStore, type ChunkRender } from "../stores/cacheStore";
import { ChunkMesh } from "./ChunkMesh";

export const FramePlane = ({ index }: { index: number }) => {
  const frame = useCacheStore((s) => s.frames?.[index]);
  
  // Get ONLY the chunks that are currently globally visible AND belong to this specific frame
  const visibleChunksForFrame = useCacheStore((s) => 
    s.visibleChunks.filter(chunk => 
      // Ensure we only render chunks from this frame's store
      chunk.store.url.includes(frame?.frame_id || "")
    )
  );

  if (!frame) return null;

  return (
    <group>
      {visibleChunksForFrame.map((chunk) => (
        <Suspense 
          key={chunk.chunk_key} 
          fallback={
            // Extract coordinates for the fallback bounding box
            <FallbackMesh chunk={chunk} />
          }
        >
          <ChunkMesh chunk={chunk} />
        </Suspense>
      ))}
    </group>
  );
};

// --- Helper: Fallback Mesh ---
// Shows a wireframe exactly where the chunk WILL be while data is downloading
const FallbackMesh = ({ chunk }: { chunk: ChunkRender }) => {
  const chunkHeight = chunk.chunk_shape[2];
  const chunkWidth = chunk.chunk_shape[3];
  const [, , yIdx, xIdx] = chunk.chunk_coord.split(',').map(Number);
  
  const xPos = xIdx * chunkWidth + (chunkWidth / 2);
  const yPos = -(yIdx * chunkHeight + (chunkHeight / 2));

  return (
    <mesh position={[xPos, yPos, 0]}>
      <planeGeometry args={[chunkWidth, chunkHeight]} />
      <meshBasicMaterial color="gray" wireframe={true} />
    </mesh>
  );
};

export default FramePlane;