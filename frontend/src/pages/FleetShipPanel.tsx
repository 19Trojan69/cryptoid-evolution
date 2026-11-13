import { useState, type ComponentProps } from "react";
import ShipSelectionPanel from "./ShipSelectionPanel";
import { allPlayerColors, fleetCount, shipFactoryPaint, shipPaintAvailable, type PlayerColorId } from "./shipFleet";
import type { ShipStage } from "./shipEvolution";
type Color = typeof allPlayerColors[number];
type Props = Omit<ComponentProps<typeof ShipSelectionPanel>, "color" | "focusStage" | "onBuyStandard" | "onColorChange" | "onStageChange" | "onEquipPreview" | "onOpenShop"> & {
  requestedStage?: ShipStage; onBuy: (color: Color) => void; onEquip: (color: Color, stage: ShipStage) => void;
  onUpgrade: (stage: ShipStage) => void; onStage: (stage: ShipStage) => void;
};
export default function FleetShipPanel(props: Props) {
  const { skin, fleet, view, adminPreview, selectedSkinId, selectedColorId } = props;
  const [previewColorId, setPreviewColorId] = useState<PlayerColorId>();
  const [stage, setStage] = useState<ShipStage>(props.requestedStage ?? (view === "hangar" ? props.ownedStage : 1));
  const [lastOwnedStage, setLastOwnedStage] = useState(props.ownedStage);
  if (props.ownedStage !== lastOwnedStage) { setLastOwnedStage(props.ownedStage); if (view === "hangar" && stage === lastOwnedStage) setStage(props.ownedStage); }
  const [lastRequested, setLastRequested] = useState(props.requestedStage);
  if (props.requestedStage !== lastRequested) { setLastRequested(props.requestedStage); if (props.requestedStage) setStage(props.requestedStage); }
  const factoryPaint = shipFactoryPaint(skin.id);
  const ownedPaint = skin.id === selectedSkinId ? selectedColorId :
    allPlayerColors.find(color => fleetCount(fleet, skin.id, color.id))?.id;
  const displayColor = previewColorId ?? (view === 'shop' || adminPreview ? factoryPaint.id : ownedPaint ?? factoryPaint.id);
  const color = allPlayerColors.find(item => item.id === displayColor && shipPaintAvailable(skin.id, item.id)) ?? factoryPaint;
  return <ShipSelectionPanel {...props} color={color} focusStage={stage}
    onColorChange={next => setPreviewColorId(next.id)}
    onStageChange={next => { setStage(next); props.onStage(next); }}
    onBuyStandard={() => props.onBuy(color)} onEquipPreview={stage => props.onEquip(color, stage)} onOpenShop={props.onUpgrade}/>;
}
