export type InsectoidBody = 'scarab'|'mantis'|'wasp'|'dragonfly'|'widow'|'moth'|'scorpion'|'centipede'|'hornet'|'weevil';
export type Insectoid = {id:number;name:string;body:InsectoidBody;variant:number;color:string;trim:string;hp:number;radius:number;fireMs:number};
const designs:readonly [string,InsectoidBody,string,string,number,number,number][] = [
 ['Acid Drone','scarab','#9ce43e','#436226',1,19,3300],
 ['Needle Wasp','wasp','#e2df39','#675619',1,17,2900],
 ['Mantis Scout','mantis','#63df97','#345e51',2,21,3400],
 ['Cyan Skimmer','dragonfly','#52e7db','#305d76',1,22,2800],
 ['Violet Weaver','widow','#ce64ed','#533965',2,21,3600],
 ['Ash Moth','moth','#f59762','#645056',2,24,3700],
 ['Venom Pincer','scorpion','#a8e543','#4c5436',3,22,3900],
 ['Ion Crawler','centipede','#70b9ff','#364e73',2,21,3000],
 ['Ember Hornet','hornet','#f78343','#73422e',3,20,3200],
 ['Obsidian Borer','weevil','#fb6896','#533a58',3,21,4000],
 ['Caustic Sentinel','scarab','#b0f351','#354a30',3,23,3100],
 ['Sulfur Lancet','wasp','#ffe84b','#746037',2,20,2700],
 ['Razor Harvester','mantis','#ff6d6c','#663839',3,24,3500],
 ['Rift Darter','dragonfly','#63d6ff','#354675',2,23,3000],
 ['Neon Recluse','widow','#f46ed7','#60346e',3,24,3400],
 ['Dusk Wing','moth','#ae8dff','#4d3e72',3,25,3800],
 ['Toxic Executioner','scorpion','#edb744','#6b4a36',4,25,4000],
 ['Plague Conveyor','centipede','#72f1bd','#315c58',3,24,3200],
 ['Furnace Vespid','hornet','#ff6048','#773538',4,23,3400],
 ['Void Drill','weevil','#ba61ff','#453b6b',4,24,3700],
];
export const insectoidRoster:readonly Insectoid[] = designs.map(([name,body,color,trim,hp,radius,fireMs],i)=>({id:i,name,body,variant:i<10?0:1,color,trim,hp,radius,fireMs}));

/** Optimized transparent raster sprites; source masters are preserved separately. */
export const insectoidAsset=(id:number)=>`/ships/insectoids/enemy-${String(id+1).padStart(2,'0')}.webp`;
