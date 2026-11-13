import { useState, type ComponentProps } from "react";
import ShipSelectionPanel from "./ShipSelectionPanel";
import type { ShipStage } from "./shipEvolution";
type Props = Omit<ComponentProps<typeof ShipSelectionPanel>, "focusStage" | "onBuyStandard" | "onStageChange" | "onEquipPreview" | "onOpenShop"> & {
  requestedStage?: ShipStage; onBuy: () => void; onEquip: (stage: ShipStage) => void;
  onUpgrade: (stage: ShipStage) => void; onStage: (stage: ShipStage) => void;
};
export default function FleetShipPanel(props: Props) {
  const { view } = props;
  const [stage, setStage] = useState<ShipStage>(props.requestedStage ?? (view === "hangar" ? props.ownedStage : 1));
  const [lastOwnedStage, setLastOwnedStage] = useState(props.ownedStage);
  if (props.ownedStage !== lastOwnedStage) { setLastOwnedStage(props.ownedStage); if (view === "hangar" && stage === lastOwnedStage) setStage(props.ownedStage); }
  const [lastRequested, setLastRequested] = useState(props.requestedStage);
  if (props.requestedStage !== lastRequested) { setLastRequested(props.requestedStage); if (props.requestedStage) setStage(props.requestedStage); }
  return <ShipSelectionPanel {...props} focusStage={stage}
    onStageChange={next => { setStage(next); props.onStage(next); }}
    onBuyStandard={props.onBuy} onEquipPreview={props.onEquip} onOpenShop={props.onUpgrade}/>;
}
