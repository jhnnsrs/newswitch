import type { KubeUnionSchema } from "@/hooks/states/ExpanseState";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { z } from "zod";

export type KubeState = z.infer<typeof KubeUnionSchema>;

interface KubeStateStore {
  selectedKubeState: KubeState | null;
  setSelectedKubeState: (id: KubeState | null) => void;
}

export const useKubeStateStore = create<KubeStateStore>()(
  immer((set) => ({
    selectedKubeState: null,
    setSelectedKubeState: (id) =>
      set((state) => {
        state.selectedKubeState = id;
      }),
  })),
);
