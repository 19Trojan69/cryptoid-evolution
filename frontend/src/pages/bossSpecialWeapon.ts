import type { SectorBoss } from './sectorBoss.ts';

export type SpecialWeaponShape = 'lance' | 'siege' | 'twin' | 'trident' | 'fork';
export type SpecialWeaponMount = {
  id: number;
  /** Every mount sits on the centreline; y/height are fractions of hull height. */
  y: number; height: number; aspect: number; shape: SpecialWeaponShape;
  metal: string; trim: string; energy: string;
};

// Hand-placed against the current, strength-sorted hulls, not original asset IDs.
// Bridge-mounted weapons (18/48) remain on the crossmember, above the open bay.
const placements: readonly (readonly [number, number, number, SpecialWeaponShape])[] = [
  [.53,.40,.57,'lance'], [.45,.38,.54,'fork'], [.40,.34,.64,'siege'], [.34,.30,.54,'lance'], [.32,.28,.57,'twin'],
  [.46,.36,.60,'fork'], [.53,.42,.78,'siege'], [.31,.31,.68,'twin'], [.51,.40,.55,'lance'], [.32,.28,.53,'fork'],
  [.40,.35,.57,'lance'], [.51,.38,.68,'twin'], [.37,.34,.77,'siege'], [.43,.36,.63,'trident'], [.48,.38,.59,'fork'],
  [.67,.26,.53,'lance'], [.50,.38,.62,'fork'], [.31,.25,.72,'twin'], [.36,.32,.55,'lance'], [.38,.34,.74,'siege'],
  [.35,.31,.56,'fork'], [.55,.40,.62,'trident'], [.45,.39,.66,'twin'], [.54,.38,.52,'lance'], [.70,.32,.72,'siege'],
  [.35,.30,.64,'twin'], [.45,.34,.67,'siege'], [.26,.24,.55,'fork'], [.37,.30,.48,'lance'], [.26,.25,.64,'twin'],
  [.79,.25,.65,'siege'], [.52,.43,.75,'trident'], [.33,.31,.56,'lance'], [.53,.38,.55,'fork'], [.40,.36,.69,'twin'],
  [.43,.36,.54,'lance'], [.51,.40,.66,'trident'], [.31,.26,.68,'siege'], [.76,.27,.64,'twin'], [.54,.35,.56,'fork'],
  [.54,.37,.72,'trident'], [.44,.35,.75,'siege'], [.33,.28,.62,'twin'], [.44,.37,.55,'lance'], [.43,.32,.66,'fork'],
  [.29,.26,.55,'lance'], [.44,.34,.76,'siege'], [.35,.23,.65,'twin'], [.39,.34,.63,'trident'], [.33,.28,.68,'siege'],
];

// Armour and illumination follow the ten existing fleet paint schemes.
const finishes = [
  ['#64717a','#bf552f','#ffad63'], ['#5c7378','#be763d','#7ce8f2'],
  ['#82909c','#4355a6','#ff9f70'], ['#747c59','#518333','#ffe59a'],
  ['#6a6873','#ad4779','#86e9ff'], ['#636771','#ac8536','#ff7082'],
  ['#9b8c6c','#9a3335','#ffd57e'], ['#516b7c','#357f9f','#ff7b9c'],
  ['#888793','#695295','#ffcd83'], ['#555e53','#939226','#ff7e9c'],
] as const;

export const bossSpecialWeapons: readonly SpecialWeaponMount[] = placements.map(([y,height,aspect,shape],i) => {
  const [metal,trim,energy] = finishes[i % finishes.length];
  return {id:i+1,y,height,aspect,shape,metal,trim,energy};
});
export const specialWeaponMount = (boss: SectorBoss) => bossSpecialWeapons[boss.config.id - 1];
export const specialWeaponBox = (boss: SectorBoss) => {
  const mount = specialWeaponMount(boss);
  const height = boss.height * mount.height;
  const width = height * mount.aspect;
  return {left:boss.width / 2 - width / 2,top:boss.height * mount.y - height / 2,width,height};
};
export const specialWeaponBarrels = (shape: SpecialWeaponShape): readonly number[] =>
  shape === 'twin' ? [34,66] : shape === 'trident' ? [28,50,72] : [50];

/** Shared by the SVG muzzle and projectile simulation, including saved fights. */
export const specialWeaponMuzzle = (boss: SectorBoss, barrel = 0) => {
  const box = specialWeaponBox(boss);
  const barrels = specialWeaponBarrels(specialWeaponMount(boss).shape);
  return {
    x:boss.x - boss.width / 2 + box.left + box.width * barrels[barrel % barrels.length] / 100,
    y:boss.y - boss.height / 2 + box.top + box.height * .925,
  };
};
