// --- 1. Promise Cache for Suspense ---

import type { ChunkRender } from "../../stores/cacheStore";

// This prevents infinite re-renders by storing the fetch promises.
const chunkPromiseCache = new Map<string, Promise<Uint8Array | undefined>>();
const chunkDataCache = new Map<string, Uint8Array>();

/**
 * Suspense-compatible data fetcher for a single chunk.
 */
export function useChunkData(chunk: ChunkRender): Uint8Array {
  // We use the store URL + chunk key as a globally unique identifier
  const uniqueKey = `${chunk.store.url}-${chunk.chunk_key}`;

  if (chunkDataCache.has(uniqueKey)) {
    return chunkDataCache.get(uniqueKey)!;
  }

  if (!chunkPromiseCache.has(uniqueKey)) {
    const fetchPromise = chunk.store.get(chunk.chunk_key).then((data: Uint8Array | undefined) => {
      if (data) {
        chunkDataCache.set(uniqueKey, data);
      }
      chunkPromiseCache.delete(uniqueKey);
      return data;
    });
    chunkPromiseCache.set(uniqueKey, fetchPromise);
  }

  throw chunkPromiseCache.get(uniqueKey);
}