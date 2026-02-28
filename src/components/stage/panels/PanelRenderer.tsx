import { Card } from "@/components/ui/card";
import { usePanel } from "../PanelProvider";
import { ActionButton } from "@/components/ActionButton";
import { MoveStageDefinition } from "@/hooks/generated";

/**
 * ClickWidget: Context menu for world-space interaction.
 */
export const PanelRenderer = () => {
  const { activePanel } = usePanel();

  if (!activePanel || activePanel.panelType !== "clickWidget") return null;

  return (
    <Card
      className="bg-white/90 border border-gray-400 rounded p-2 text-sm"
      style={{
        position: "absolute",
        left: activePanel.screenPos.x,
        top: activePanel.screenPos.y,
        transform: "translate(-50%, -100%)", // Position above the click point
        pointerEvents: "auto", // Allow interaction with the panel
      }}
    >
      <ActionButton
        action={MoveStageDefinition}
        args={{
          x: activePanel.worldPos.x,
          y: activePanel.worldPos.y,
          z: activePanel.worldPos.z,
        }}
        className="w-full"
      >
        {" "}
        Move{" "}
      </ActionButton>
    </Card>
  );
};
