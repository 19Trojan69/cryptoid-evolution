import { useState, type ComponentProps } from "react";
import ShipSelectionPanel from "./ShipSelectionPanel";
import type { ShipStage } from "./shipEvolution";
import type { PlayerColorId } from "./shipFleet";
type Props = Omit<ComponentProps<typeof ShipSelectionPanel>, "focusStage" | "previewColorId" | "onColorChange" | "onBuyStandard" | "onStageChange" | "onEquipPreview" | "onOpenShop"> & {
  requestedStage?: ShipStage; onBuy: () => void; onEquip: (stage: ShipStage, color: PlayerColorId) => void;
  onUpgrade: (stage: ShipStage) => void; onStage: (stage: ShipStage) => void;
};
export default function FleetShipPanel(props: Props) {
  const { view } = props;
  const equippedStage = props.selectedSkinId === props.skin.id ? props.selectedStage : undefined;
  const [stage, setStage] = useState<ShipStage>(props.requestedStage ?? equippedStage ?? (view === "hangar" ? props.ownedStage : 1));
  const [lastOwnedStage, setLastOwnedStage] = useState(props.ownedStage);
  if (props.ownedStage !== lastOwnedStage) { setLastOwnedStage(props.ownedStage); if (view === "hangar" && stage === lastOwnedStage) setStage(equippedStage ?? props.ownedStage); }
  const [lastRequested, setLastRequested] = useState(props.requestedStage);
  if (props.requestedStage !== lastRequested) { setLastRequested(props.requestedStage); if (props.requestedStage) setStage(props.requestedStage); }
  const [paint, setPaint] = useState<PlayerColorId>();
  return <ShipSelectionPanel {...props} focusStage={stage}
    previewColorId={paint} onColorChange={setPaint}
    onStageChange={next => { setStage(next); props.onStage(next); }}
    onBuyStandard={props.onBuy} onEquipPreview={props.onEquip} onOpenShop={props.onUpgrade}/>;
}
