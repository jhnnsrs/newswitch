import { create } from 'zustand';
import * as THREE from 'three';

interface ViewState {
    // We store the combined projection + view matrix
    viewProjectionMatrix: THREE.Matrix4 | null;
    viewportSize: { width: number; height: number };
    
    updateCameraData: (matrix: THREE.Matrix4, size: { width: number; height: number }) => void;
}

export const useViewStore = create<ViewState>((set) => ({
    viewProjectionMatrix: null,
    viewportSize: { width: 0, height: 0 },
    
    updateCameraData: (matrix, size) => 
        set({ 
            viewProjectionMatrix: matrix, 
            viewportSize: size 
        }),
}));