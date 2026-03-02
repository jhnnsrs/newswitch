import { useExpanseState } from "@/hooks/states/ExpanseState";
import { FrameVolume } from "./FrameVolume";

export const FramesPlane = () => {
  // 1. Get the descriptors directly from your backend state hook
  const {data} = useExpanseState();

  // 2. Map over them. React handles all mounting, fetching, and unmounting automatically.
  return (
    <group>
      {data?.current_frames?.map((frame) => (
        <FrameVolume key={frame.id} frame={frame} />
      ))}
    </group>
  );
};
