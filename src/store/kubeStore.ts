import type { KubeUnionSchema } from "@/hooks/states/LightPathState";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { z } from "zod";
import type { KubeState } from "./kubeStateStore";

export type Kube = z.infer<typeof KubeUnionSchema>;

interface KubeStore {
  selectedKube: Kube | null;
  setSelectedKube: (id: Kube | null) => void;
}

export const useKubeStore = create<KubeStore>()(
  immer((set) => ({
    selectedKube: null,
    setSelectedKube: (id) =>
      set((state) => {
        state.selectedKube = id;
      }),
  })),
);
