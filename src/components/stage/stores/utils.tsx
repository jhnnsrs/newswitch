import { BasicIndexer, type IndexerProjection, type Slice } from "./indexer";
import { ChunkRender} from "./cacheStore";




export const calculateChunkGrid = (
  selection: (number | Slice | null)[],
  shape: number[],
  chunks: number[],
): ChunkRender[] => {
  const indexer = new BasicIndexer({
    selection,
    shape: shape,
    chunk_shape: chunks,
  });

  const chunk_loaders: {
    chunk_coords: number[];
    mapping: IndexerProjection[];
  }[] = [];

  for (const { chunk_coords, mapping } of indexer) {
    chunk_loaders.push({ chunk_coords, mapping });
  }

  return chunk_loaders.map(({ chunk_coords, mapping }) => ({
    chunk_coords,
    mapping,
    
  }));
};