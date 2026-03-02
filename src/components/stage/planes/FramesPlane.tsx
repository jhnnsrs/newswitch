import { Suspense } from "react";
import { useCacheStore } from "../stores/cacheStore";
import FramePlane from "./FramePlane";

export const FramesPlane = () => {
  const frames = useCacheStore((s) => s.frames);

  return (
    <Suspense fallback={<></>}>
      {frames?.map((frame, idx) => (
        <FramePlane key={idx} index={idx} />
      ))}
    </Suspense>
  );
};
