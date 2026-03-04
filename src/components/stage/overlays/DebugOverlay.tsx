import { Button } from "@/components/ui/button";
import { useDumpStatesToStdin } from "@/hooks/generated";
import { useViewerStore } from "@/store/viewerStore";

export const DebugOverlay = () => {

    const isDebug = useViewerStore((state) => state.debug);
    const setDebug = useViewerStore((state) => state.setDebug);
    const {call: dump} = useDumpStatesToStdin();

    return <div className="absolute top-4 right-4 ">
        <Button onClick={() => {
            setDebug(!isDebug);
        }} variant={isDebug ? "destructive" : "outline"} size={"sm"}>
            { isDebug ? "Disable Debug" : "Enable Debug" }
        </Button>
        <Button onClick={() => {
            dump({});
        }} variant={"outline"} size={"sm"}>
            Dump States
        </Button>
    </div>
  
}