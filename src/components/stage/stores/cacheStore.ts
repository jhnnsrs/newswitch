import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { BACKEND_API } from "@/constants";
import type { Frame, Metadata } from "../hooks/zarr/types";
import { CachedFetchStore } from "../hooks/zarr/zarr_stores/fetchStore";
import { Array, type Chunk, type DataType, get, open ,} from "zarrita";


export const GLOBAL_CACHE_ENDPOINT = `${BACKEND_API}/cache`;


// --- Store Types ---

export type Store = any; // Broadened from CachedFetchStore to allow any Zarrita-compatible store

export type ChunkRender = {
  // Broadened from CachedFetchStore to allow any Zarrita-compatible store
  store: Store; 
  chunk_coord: string; // e.g., "t,z,y,x"
  chunk_key: string;   // e.g., "c/t/z/y/x"
  metadata: Metadata;
  chunk_shape: number[]; 
  t_index: number;
  z_index: number;
};

export type ScaleRender = {
  scale_index: number;
  chunks: ChunkRender[];
  metadata: Metadata;
};

export type FrameRender = {
  colormap: string;
  frame_id: string;
  chunks: ScaleRender[];
  metadata: Metadata;
}; 

export type DimRange = {
  start: number | null;
  end: number | null;
};

export type AddFrameOptions = {
  // Allows injecting any class constructor that accepts a string URL
  StoreClass?: new (url: string) => any;
};

interface CacheState {
  cacheEndpoint: string | null;
  frames: FrameRender[];
  visibleChunks: ChunkRender[];
  
  zRange: DimRange;
  tRange: DimRange;

  addFrame: (frame: Frame, options?: AddFrameOptions) => Promise<void>;
  sliceZ: (start: number | null, end: number | null) => void;
  sliceT: (start: number | null, end: number | null) => void;
  
  _updateVisibleChunks: () => void;
}

// --- Zustand Store ---

export const useCacheStore = create<CacheState>()(
  immer((set, get) => ({
    cacheEndpoint: GLOBAL_CACHE_ENDPOINT,
    visibleChunks: [],
    frames: [],
    
    zRange: { start: null, end: null },
    tRange: { start: null, end: null },
    
    addFrame: async (frame: Frame, options?: AddFrameOptions) => {
      const frameUrl = `${GLOBAL_CACHE_ENDPOINT}/${frame.id}`; 
      
      // Use the injected StoreClass, or fall back to the default CachedFetchStore
      const StoreConstructor = options?.StoreClass || CachedFetchStore;
      const store = new StoreConstructor(frameUrl);
      
      const arr = await open.v3(store, { kind: "array" });
      


      const shape = arr.shape;             
      const chunk_shape = arr.chunks; 

      const [tDim = 1, zDim = 1, yDim = 1, xDim = 1] = shape.length === 4 ? shape : [1, ...shape];
      const [tChunk = 1, zChunk = 1, yChunk = 1, xChunk = 1] = chunk_shape.length === 4 ? chunk_shape : [1, ...chunk_shape];

      const chunks: ChunkRender[] = [];

      for (let t = 0; t < Math.ceil(tDim / tChunk); t++) {
        for (let z = 0; z < Math.ceil(zDim / zChunk); z++) {
          for (let y = 0; y < Math.ceil(yDim / yChunk); y++) {
            for (let x = 0; x < Math.ceil(xDim / xChunk); x++) {
              
              chunks.push({
                store: store,
                chunk_coord: `${t},${z},${y},${x}`,
                chunk_key: `c/${t}/${z}/${y}/${x}`, 
                metadata: frame.metadata,
                chunk_shape: [tChunk, zChunk, yChunk, xChunk], 
                t_index: t,
                z_index: z,
              });

            }
          }
        }
      }

      const scaleRender: ScaleRender = {
        scale_index: 0,
        chunks: chunks,
        metadata: frame.metadata,
      };

      const newFrame: FrameRender = {
        colormap: "gray",
        frame_id: frame.id,
        chunks: [scaleRender],
        metadata: frame.metadata,
      };

      set((state) => {
        state.frames.push(newFrame);
      });
      
      get()._updateVisibleChunks();
    },
 
    sliceZ: (start: number | null, end: number | null) => {
      set((state) => {
        state.zRange = { start, end };
      });
      get()._updateVisibleChunks();
    },

    sliceT: (start: number | null, end: number | null) => {
      set((state) => {
        state.tRange = { start, end };
      });
      get()._updateVisibleChunks();
    },

    _updateVisibleChunks: () => set((state) => {
      const { zRange, tRange, frames } = state;

      state.visibleChunks = frames.flatMap(f => 
        f.chunks.flatMap(s => 
          s.chunks.filter(chunk => {
            
            // --- T Dimension Check ---
            const tChunkSize = chunk.chunk_shape[0];
            const tStart = chunk.t_index * tChunkSize;
            const tEnd = tStart + tChunkSize - 1; 

            const tIsVisible = 
              (tRange.start === null || tEnd >= tRange.start) && 
              (tRange.end === null || tStart <= tRange.end);

            if (!tIsVisible) return false;

            // --- Z Dimension Check ---
            const zChunkSize = chunk.chunk_shape[1];
            const zStart = chunk.z_index * zChunkSize;
            const zEnd = zStart + zChunkSize - 1; 

            const zIsVisible = 
              (zRange.start === null || zEnd >= zRange.start) && 
              (zRange.end === null || zStart <= zRange.end);

            return zIsVisible;
          })
        )
      );
    })
  }))
);