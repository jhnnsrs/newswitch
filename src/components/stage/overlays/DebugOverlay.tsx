import { Button } from "@/components/ui/button";
import { useViewerStore } from "@/store/viewerStore";

export const DebugOverlay = () => {

    const isDebug = useViewerStore((state) => state.debug);
    const setDebug = useViewerStore((state) => state.setDebug);

    return <div className="absolute top-4 right-4 ">
        <Button onClick={() => {
            setDebug(!isDebug);
        }} variant={isDebug ? "destructive" : "outline"} size={"sm"}>
            { isDebug ? "Disable Debug" : "Enable Debug" }
        </Button>
    </div>
  
}