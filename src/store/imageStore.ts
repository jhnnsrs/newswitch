import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';



interface ImageState {
    selectedImageId: string | null;
    setSelectedImageId: (id: string | null) => void;
}

export const useImageStore = create<ImageState>()(
    immer((set) => ({
        selectedImageId: null,
        setSelectedImageId: (id) => set((state) => { state.selectedImageId = id; }),
    }))
);  