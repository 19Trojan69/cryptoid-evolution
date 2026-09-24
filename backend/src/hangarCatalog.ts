export const hangarCatalog = [
  { id: "weapon_twin", kind: "weapon", name: "Twin Laser", description: "Two parallel shots per volley.", pricePi: 0.1, level: 2 },
  { id: "weapon_rapid_twin", kind: "weapon", name: "Rapid Twin", description: "Two shots with faster automatic fire.", pricePi: 0.16, level: 3 },
  { id: "weapon_triple", kind: "weapon", name: "Triple Laser", description: "Three spreading shots per volley.", pricePi: 0.22, level: 4 },
  { id: "weapon_plasma", kind: "weapon", name: "Plasma", description: "Three stronger plasma bolts per volley.", pricePi: 0.3, level: 5 },
  { id: "start_shield", kind: "power", name: "Start Shield", description: "Begin one mission with one shield charge.", pricePi: 0.08, powerUp: "shield" },
  { id: "start_rapid", kind: "power", name: "Start Rapid Fire", description: "Begin one mission with 15 seconds of rapid fire.", pricePi: 0.09, powerUp: "rapid" },
  { id: "start_overdrive", kind: "power", name: "Start Overdrive", description: "Begin one mission with 12 seconds of Overdrive.", pricePi: 0.12, powerUp: "overdrive" },
] as const;

export const findOffer = (id: unknown) => hangarCatalog.find(item => item.id === id);
