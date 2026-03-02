// --- 1. Local Types ---

import type { AbsolutePath } from "@zarrita/storage"
import type { ZarrStore } from "../hooks/zarr/zarr_stores/type";
import type { Metadata } from "@/hooks/generated";
import * as THREE from "three";

export type ChunkData = {
  frame_id: string;
  store: ZarrStore;
  chunk_coord: string;
  chunk_key: AbsolutePath;
  chunk_shape: number[];
  z_index: number;
  min_value: number;
  max_value: number;
  metadata: Metadata
  colormapTexture: THREE.Texture | null;
};