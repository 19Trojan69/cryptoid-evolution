import { useState, type ComponentProps } from "react";
import ShipSelectionPanel from "./ShipSelectionPanel";
import { allPlayerColors, fleetCount, playerColors } from "./shipFleet";
import { namedShipColor } from "./shipIdentityColor";
import type { ShipStage } from "./shipEvolution";
type Color = typeof allPlayerColors[number];
type Props = Omit<ComponentProps<typeof ShipSelectionPanel>, "color" | "focusStage" | "onBuyStandard" | "onColorChange" | "onStageChange" | "onEquipPreview" | "onOpenShop"> & {
  requestedStage?: ShipStage; onBuy: (color: Color) => void; onEquip: (color: Color) => void;
  onUpgrade: (stage: ShipStage) => void; onStage: (stage: ShipStage) => void;
};
export default function FleetShipPanel(props: Props) {
  const { skin, fleet, view, selectedSkinId, selectedColorId } = props;
  const [colorId, setColorId] = useState(() => skin.id === selectedSkinId ? selectedColorId :
    allPlayerColors.find(color => fleetCount(fleet, skin.id, color.id))?.id ?? namedShipColor(skin.sprite) ?? "silver");
  const [stage, setStage] = useState<ShipStage>(props.requestedStage ?? 1);
  const [lastRequested, setLastRequested] = useState(props.requestedStage);
  if (props.requestedStage !== lastRequested) { setLastRequested(props.requestedStage); if (props.requestedStage) setStage(props.requestedStage); }
  const displayColor = view === "hangar" && skin.id === selectedSkinId ? selectedColorId : colorId;
  const color = allPlayerColors.find(item => item.id === displayColor) ?? playerColors[0];
  return <ShipSelectionPanel {...props} color={color} focusStage={stage}
    onColorChange={next => { setColorId(next.id); if (view === "hangar") props.onEquip(next); }}
    onStageChange={next => { setStage(next); props.onStage(next); }}
    onBuyStandard={() => props.onBuy(color)} onEquipPreview={() => props.onEquip(color)} onOpenShop={props.onUpgrade}/>;
}
