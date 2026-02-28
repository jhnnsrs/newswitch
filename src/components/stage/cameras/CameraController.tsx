import { useModeStore } from '@/store/modeStore';
import { MapControls, OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';

export const CameraController = () => {
    const interactionMode = useModeStore((s) => s.interactionMode);
    const displayMode = useModeStore((s) => s.displayMode);
    ;

    return (
        <>
            {/* Camera Rig */}
            {displayMode === '3D' ? (
                <PerspectiveCamera makeDefault position={[0, -200, 200]} fov={45} up={[0, 0, 1]} />
            ) : (
                <OrthographicCamera makeDefault zoom={5} position={[0, 0, 500]} up={[0, 0, 1]} />
            )}

            {/* Orbit Controls 
                Disable panning/rotating when scanning so the screen doesn't drag while drawing.
            */}
            {displayMode === '3D' ? <OrbitControls 
                makeDefault 
                enableRotate={displayMode === '3D'}
                enablePan={interactionMode === 'PAN'} 
                enableZoom={true}
            /> :
              <MapControls
                makeDefault 
                enableZoom={true}
                enableRotate={false}
            />}
        </>
    );
};