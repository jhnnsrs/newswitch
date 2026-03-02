import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface SelectionState {
  selectedImageId: string | null;
  setSelectedImageId: (id: string | null) => void;
  selectedFrameId: string | null;
  setSelectedFrameId: (id: string | null) => void;
}

export const useSelectionStore = create<SelectionState>()(
  immer((set) => ({
    selectedImageId: null,
    setSelectedImageId: (id) =>
      set((state) => {
        state.selectedImageId = id;
      }),
    selectedFrameId: null,
    setSelectedFrameId: (id) =>
      set((state) => {
        state.selectedFrameId = id;
      }),
  })),
);
