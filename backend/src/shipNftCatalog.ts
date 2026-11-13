export const shipNftEditions = ["Standard", "Advanced", "Elite"] as const;
export const shipNftMaxSupply = { Standard: 99_999, Advanced: 31_415, Elite: 3_141 } as const;
export const shipNftLivery = "Original Livery";

// The three entries follow the ship's Standard, Advanced and Elite stages.
// These are the English stories printed on the cards and used in their metadata.
export const shipNftStories = {
  "grey-scout": [
    "Built from salvaged parts after the outer relays fell silent, the Grey Scout brought home lost courier beacons and the voices they carried.",
    "In contested relay zones, the squadron retrieves abandoned messages under the callsigns of the first rescue crews.",
    "When a sector falls silent, the Elite escort guards its last surviving relay. The names of missing couriers travel in its archive.",
  ],
  "nova-wing": [
    "Nova Wing crossed the luminous rim and brought back charts that distant colonies could use to find their own way through.",
    "Its pilots fly beside couriers carrying the rim charts to new ports. The first star on those charts still marks their insignia.",
    "When false charts steer convoys toward danger, the expedition retraces the routes and follows the forgeries to their source.",
  ],
  "solar-lance": [
    "Solar Lance led heavy rescue freighters through the wreckage of a dying star's final collection ring.",
    "The watch keeps the resettled colonies supplied. Every crew transmits the old evacuation code before approaching a new harbour.",
    "The shadow fleet has found the new solar stores. Elite formations hold the approach, guarding the light the refugees carried away.",
  ],
  "dark-delta": [
    "Dark Delta searched silent outposts for survivors. Its early logs recorded the coordinates and kept the rescued settlers' names private.",
    "Threatened archivists travel under Dark Delta escort. The sealed mission logs are opened only once their passengers reach safety.",
    "When colonies disagree about what happened, the Elite crews bring the witnesses home. Most arrivals pass without anyone hearing the engines.",
  ],
  "gold-streak": [
    "Gold Streak racers knew every shortcut between the trading moons. During the supply crisis, those routes carried medical records past closed ports.",
    "The old racing numbers still identify the couriers. Their flight plans now connect clinics waiting for confirmed aid.",
    "The league escorts the sector's largest rescue convoys. Its crews count the ships that arrive before they count their own honours.",
  ],
  "iron-guard": [
    "Dock workers welded the first Iron Guard from retired lifting cranes. The names of the night shift went on the keel.",
    "Mobile repair docks travel under the Advanced watch. Its crews know which shelters can still receive a ship with a failing drive.",
    "As shattered stations are rebuilt, Elite escorts cover the work crews. Their honours carry the names of the shipyards that came back to life.",
  ],
  "vector": [
    "Vector crossed an uncharted ring of debris by comparing several navigators' readings. The first chart kept every measurement they disagreed on.",
    "Advanced formations survey reopened trade routes. A course goes out to freighters only after several navigators have signed it.",
    "When charts disagree along the same corridor, the Elite expedition follows each trail of readings to find who moved the route.",
  ],
  "verdant": [
    "Verdant carried the first seed archive to a colony without soil. One intact catalogue could feed the settlement through winter.",
    "Verdant escorts seed exchanges between greenhouse stations. The callsigns preserve plant names their crews hope to see growing again.",
    "The Elite guard carries the last complete seed register. A copy is held for settlements still waiting to plant their first garden.",
  ],
  "storm-wing": [
    "Shipyards built Storm Wing between ion-storm blackouts. Couriers carried the plans, and the first finished ship united every piece.",
    "The squadron ferries maintenance buoys to the storm frontier. Every buoy it sets in place brings a distant station back within reach.",
    "After a blackout, Elite crews escort the repair convoys through the storm. Returning convoy lights tell the frontier that the route is open.",
  ],
  "red-comet": [
    "Three colonies saw Red Comet's trail on the flight that saved the last water-purifier plans. By dawn, a settlement could drink again.",
    "The Advanced ships carry repair plans into emergency zones. Their red markings tell the crews below that technical help has arrived.",
    "The Elite escort stays on the air after its final delivery to a besieged colony. The mission ends when the recipient answers.",
  ],
  "twin-core": [
    "Two shipyards once at war built Twin Core together. Each inspected the other's work, and matching reports cleared the first joint flight.",
    "Crewed by both home ports, Advanced Twin Cores share a logbook. Pilots record where they disagree before deciding on a course.",
    "When former rivals sign an accord, the Elite formation escorts both delegations. It stands down only once both have arrived safely.",
  ],
  "orbit-arc": [
    "Orbit Arc carried letters between stations that met only rarely. Their regular handovers became the appointments of a thriving trade route.",
    "Advanced couriers keep the outer-ring handovers on schedule. Even when a station has nothing to trade, its mail still makes the rendezvous.",
    "Elite Orbit Arcs escort travelling colonies to the places where their orbits meet. Their signals announce the start of each reunion.",
  ],
  "night-guard": [
    "From the dark side of a tidally locked moon, Night Guard patrols kept a single dock lit for the last freighter home.",
    "The Advanced watch flies supplies through long spells of radio silence. Each shift carries the name of a ship brought safely back.",
    "The refuge ports keep their beacons lit under Elite guard. Its last ship leaves with the final evacuation crew.",
  ],
  "striker": [
    "Mechanics flew the first Strikers. Their escorts bought repair crews the minutes they needed to bring damaged engines back to life.",
    "The Advanced wing holds position around mobile workshops during difficult recoveries. Its pilots can read a repair crew's emergency lamps at a glance.",
    "The last salvage crews leave under Elite escort. Striker citations record the names of the workshops able to open again.",
  ],
  "cargo-hawk": [
    "Harbour tug crews exposed a ring of forged cargo receipts. Cargo Hawk took its name from the couriers who carried the proof.",
    "When cargo is disputed, the Advanced escort takes it to a joint inspection. Each party receives the same record of the delivery.",
    "The Elite fleet protects the archives that trace supplies back to their source. Its emblem recalls the tug crews that saved the first receipts.",
  ],
  "ring-flare": [
    "Inside a gas giant's ice rings, Ring Flare pilots guided scattered researchers with moving beacons. The signals survived long enough to connect new outposts.",
    "Research stations drift through the rings. Advanced squadrons track their positions and use old rendezvous names as callsigns.",
    "When forged readings reach the ring archive, Elite escorts bring back the original records from the stations that collected them.",
  ],
  "sky-breaker": [
    "Sky Breaker crossed an isolated colony's artificial communications frontier. On its return, the shipyard opened the full flight record to the public.",
    "Independent messengers cross closed borders under Advanced escort. Their holds carry reports collected on both sides of the frontier.",
    "The Elite expedition visits colonies that have dropped off the map. Its arrival gives them a channel to speak with neighbouring settlements again.",
  ],
  "olive-fortress": [
    "Former enemies built Olive Fortress in a neutral yard during an armistice. Its original paint came from the workshop they shared.",
    "Advanced crews keep a safe lane open for independent delegations. Each escort follows the talks all the way back to both home ports.",
    "The Elite watch defends the neutral archive during treaty disputes. Its orders protect the shared record even when its own allies object.",
  ],
  "pi-vanguard": [
    "Small pioneer shipyards pooled parts and labour to build Pi Vanguard. Its first flight opened a supply route every founding colony could use.",
    "Advanced crews guide new pioneer convoys along the shared routes. Their callsigns carry the names of the workshops that built the first hull.",
    "When Drazevorn threatens the frontier relays, the Elite formation keeps the pioneer colonies connected so they can exchange their own reports.",
  ],
  "core-carrier": [
    "Core Carrier gathered the last archives of threatened colonies. Every store travelled with a separate record of where it came from.",
    "The Advanced carriers connect distant archive depots. At each stop, several custodians witness the handover and compare their catalogues.",
    "After the last battle, the Elite crews guard the shared record. Their cargo lets later generations check the history for themselves.",
  ],
} as const;
