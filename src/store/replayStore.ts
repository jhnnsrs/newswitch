import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import * as THREE from "three";
import { z } from "zod";
import { ScanRegionArgsSchema } from "@/hooks/generated";
import { getOptionsFromZod } from "@/hooks/zodToChoices";
import { createScopedStoreHooks } from "./createScopedStore";

export type ScanPattern = z.infer<typeof ScanRegionArgsSchema>["scan_order"];



export interface ScanRegion {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  pattern: ScanPattern;
  overlap: number;
}



export const createReplayStore = () =>
  createStore<R>()(
  immer((set) => ({
    revision: [],

  })),
);

const {
  StoreContext: ReplayStoreContext,
  useScopedStore: useReplayStore,
  useStoreApi: useReplayStoreApi,
} = createScopedStoreHooks<ReplayState>("ReplayStore");

export { ReplayStoreContext, useReplayStore, useReplayStoreApi };
