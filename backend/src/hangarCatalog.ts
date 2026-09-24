export const hangarCatalog = [
  { id: "weapon_twin", kind: "weapon", name: "Twin Laser", description: "Two parallel shots per volley. Active for 5 minutes per mission.", pricePi: 0.1, level: 2 },
  { id: "weapon_rapid_twin", kind: "weapon", name: "Rapid Twin", description: "Two shots with faster automatic fire. Active for 5 minutes per mission.", pricePi: 0.16, level: 3 },
  { id: "weapon_triple", kind: "weapon", name: "Triple Laser", description: "Three spreading shots per volley. Active for 5 minutes per mission.", pricePi: 0.22, level: 4 },
  { id: "weapon_plasma", kind: "weapon", name: "Plasma", description: "Three stronger plasma bolts per volley. Active for 5 minutes per mission.", pricePi: 0.3, level: 5 },
  { id: "start_shield", kind: "power", name: "Start Shield", description: "Activate one shield charge from the screen-edge icon. Lasts up to 60 seconds or until hit.", pricePi: 0.08, powerUp: "shield" },
  { id: "start_rapid", kind: "power", name: "Start Rapid Fire", description: "Activate faster automatic fire from the screen-edge icon for 60 seconds.", pricePi: 0.09, powerUp: "rapid" },
  { id: "start_overdrive", kind: "power", name: "Start Overdrive", description: "Activate stronger shots from the screen-edge icon for 60 seconds.", pricePi: 0.12, powerUp: "overdrive" },
] as const;

export const findOffer = (id: unknown) => hangarCatalog.find(item => item.id === id);
