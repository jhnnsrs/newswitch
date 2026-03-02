import { Button } from "@/components/ui/button";
import type { Frame } from "../hooks/zarr/types";
import { TestNoiseZarrStore } from "../hooks/zarr/zarr_stores/noiseStore";
import { useCacheStore } from "../stores/cacheStore";

export const DebugOverlay = () => {
  const addFrame = useCacheStore((s) => s.addFrame);

  const addNoiseImage = async () => {
    
    const dummyFrame: Frame = {
        id: "test-noise-frame-01",
        // @ts-ignore - Mocking metadata for the test
        metadata: {
          affine_matrix: [[1,0,0], [0,1,0], [0,0,1]],
          fov_width: 500,
          fov_height: 500,
          acquisition_time: new Date().toISOString()
        }
      };

      // 1. Add the frame using our noise generator
      await addFrame(dummyFrame, { StoreClass: TestNoiseZarrStore });
        console.log("Added noise frame to cache!");
    };

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        color: "white",
        padding: "5px",
        fontSize: "12px",
        zIndex: 100,
      }}
    >
      <Button onClick={addNoiseImage} className="mt-2 px-2 py-1 bg-blue-500 text-white rounded">
        Add Noise Image
      </Button>
    </div>
  );
}