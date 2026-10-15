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

/** Code-native mechanical silhouettes: two deliberately different structures per
 * family, baked once into small sprites. No SVG filters or per-frame geometry. */
export function insectoidSvg(d:Insectoid) {
 const v=d.variant;
 const parts:Record<InsectoidBody,string>={
 scarab:`<path d="${v?'M31 20L13 8L2 35L10 68L29 82L36 53Z':'M31 22L12 15L3 37L8 68L31 78L37 49Z'}"/><path d="M30 65L18 90L37 77Z"/>`,
 mantis:`<path d="${v?'M34 22L6 4L0 43L17 38L10 76L29 63L35 40Z':'M34 23L9 13L1 50L17 43L14 79L30 62L37 41Z'}"/><path d="M32 58L22 89L40 75Z"/>`,
 wasp:`<path d="${v?'M35 24L0 1L7 35L31 48Z M32 51L8 50L16 76L36 68Z':'M35 27L1 12L8 46L31 52Z'}"/><path d="M32 61L19 84L37 76Z"/>`,
 dragonfly:`<path d="${v?'M36 19L0 3L2 31L34 40Z M34 45L1 48L8 78L36 66Z':'M36 20L0 10L5 40L34 44Z M34 46L2 58L14 80L38 65Z'}"/>`,
 widow:`<path fill="none" stroke-width="7" d="${v?'M36 27L18 7L0 19M33 40L5 32L0 49M34 52L9 65L3 86M39 65L25 85L29 95':'M35 29L17 12L4 21M32 42L7 37L1 51M34 52L10 62L5 81M39 62L25 80L28 91'}"/>`,
 moth:`<path d="${v?'M36 16L11 1L0 45L10 60L1 87L35 74Z':'M35 21L9 8L0 50L14 60L6 82L34 73Z'}"/>`,
 scorpion:`<path d="${v?'M34 25L12 2L0 19L3 50L18 46L14 31L31 47Z':'M34 29L13 10L2 22L3 47L18 43L16 31L32 48Z'}"/><path d="M31 51L9 54L4 76L27 65Z M37 65L22 87L38 79Z"/>`,
 centipede:`<path d="${v?'M35 20L9 10L2 23L30 35Z M32 36L3 32L1 46L31 49Z M33 51L3 57L7 72L34 64Z M37 64L13 80L23 91L41 77Z':'M36 23L11 15L4 29L33 39Z M34 39L1 41L3 57L33 53Z M36 55L8 69L17 84L40 70Z'}"/>`,
 hornet:`<path d="${v?'M34 25L5 2L0 27L28 49Z M33 48L0 49L7 74L37 66Z':'M35 26L6 13L2 38L31 50Z M33 50L8 56L16 78L38 65Z'}"/><path d="M35 65L26 88L44 76Z"/>`,
 weevil:`<path d="${v?'M32 21L9 6L0 34L6 66L33 80L37 45Z':'M33 25L12 17L3 40L9 66L33 75L39 49Z'}"/><path d="M38 67L32 96L46 81Z"/>`,
 };
 const body=v?'M48 9L34 24L31 52L40 78L48 91L56 78L65 52L62 24Z':'M48 13L36 26L33 54L41 77L48 86L55 77L63 54L60 26Z';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="-4 -4 104 104"><defs><linearGradient id="m" x2=".9" y2="1"><stop stop-color="#bdc9ba"/><stop offset=".18" stop-color="${d.trim}"/><stop offset=".55" stop-color="#18242c"/><stop offset=".8" stop-color="#53626a"/><stop offset="1" stop-color="#0b121c"/></linearGradient><linearGradient id="b"><stop stop-color="#12202a"/><stop offset=".45" stop-color="#74817b"/><stop offset=".58" stop-color="#23323c"/><stop offset="1" stop-color="#070e18"/></linearGradient></defs><g fill="url(#m)" stroke="#8e9c91" stroke-width=".9" stroke-linejoin="round"><g>${parts[d.body]}</g><g transform="translate(96 0) scale(-1 1)">${parts[d.body]}</g><path d="${body}" fill="url(#b)"/><path d="M47 22L40 38L43 54L48 59L53 54L56 38L49 22Z" fill="${d.trim}"/><path d="M46 26H50L52 44L48 49L44 44Z" fill="${d.color}" stroke="#dfffc5"/><path d="M40 58L37 73L43 87L46 73ZM56 58L59 73L53 87L50 73Z" fill="url(#m)"/><path d="M46 59H50V82H46Z" fill="#040a0f"/><path d="M47 62H49V77H47Z" fill="${d.color}"/><path d="M29 34L20 29L14 45M67 34L76 29L82 45" fill="none" stroke="${d.color}" stroke-width="2"/><circle cx="31" cy="46" r="5" fill="#09121c"/><circle cx="65" cy="46" r="5" fill="#09121c"/><path d="M29 44H33V63H29ZM63 44H67V63H63Z" fill="url(#b)"/><path d="M29 59H33M63 59H67" stroke="${d.color}" stroke-width="2"/></g></svg>`;
}
