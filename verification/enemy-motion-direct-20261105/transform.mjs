import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {transformController as previousController, proof as previousProof} from '../player-muzzle-local-20261104/transform.mjs';

export const BASE_DEVICE_COMMIT = '9f3bf451c01d6976ea1a50342cdec1470e2e080b';
export const digest = x => createHash('sha256').update(x).digest('hex');
export const blob = x => createHash('sha1').update('blob '+Buffer.byteLength(x)+'\0').update(x).digest('hex');
export const mode = new URL(import.meta.url).searchParams.get('condition') ?? 'candidate';
assert.ok(['control','candidate'].includes(mode));
const folder=resolve(new URL('.',import.meta.url).pathname);
function edits(source,pairs) {
 let changed=source;
 for(const [a,b] of pairs){assert.equal(changed.split(a).length,2,a);changed=changed.replace(a,b);}
 let restored=changed;
 for(const [a,b] of [...pairs].reverse()){assert.equal(restored.split(b).length,2);restored=restored.replace(b,a);}
 assert.equal(restored,source,'Exact reversal; no unrelated source change');return changed;
}
const bank='asteroid.visualMotion?.bank ?? 0';
const flame='engineFlamePercent(asteroid.visualMotion?.thrust ?? 0, asteroid.returnElapsed > 0 ? "return" : asteroid.entryElapsed < asteroid.entryDuration ? "launch" : asteroid.attackPattern !== null && asteroid.attackDelay <= 0 ? "boost" : "idle")';
export function enemyController(source,condition=mode) {
 assert.ok(['control','candidate'].includes(condition));
 const before='...enemyHealthClearance(sprite), "--visual-bank": `${'+bank+'}deg`, "--flame-length": `${'+flame+'}%`, "--hull-light": asteroid.hullLight ?? 0';
 const child='<GameShipVisual sprite={sprite} color={asteroid.color} variant="enemy" sites={asteroid.hullFires} hit={asteroid.hit}/>';
 const changed=edits(source,[[before,'...enemyHealthClearance(sprite)'],[child,child.replace('/>',' motionBank={'+bank+'} motionFlameLength={`${'+flame+'}%`} motionHullLight={asteroid.hullLight ?? 0}/>')]]);
 return condition==='candidate'?changed:source;
}
export function transformController(source,original,condition) {
 return enemyController(previousController(source,original,condition));
}
export function proof(source,original,condition) {
 const old=previousProof(source,original,condition),intermediate=previousController(source,original,condition);
 return {...old,compiledBeforeEnemyMotionSha256:old.compiledVirtualControllerSha256,
  compiledVirtualControllerSha256:digest(enemyController(intermediate)),
  onlyExistingMuzzleConsumerTargeted:mode==='control',enemyMotionCondition:mode};
}
export function visual(source,condition=mode) {
 assert.equal(blob(source),'54ed214a7fa2fdb024d46b639dd25e7bae32a2db');
 const changed=edits(source,[
  ['  hit?: ComponentProps<typeof HullDamage>["hit"];','  hit?: ComponentProps<typeof HullDamage>["hit"];\n  motionBank?: number; motionFlameLength?: string; motionHullLight?: number;'],
  ['variant, sites, hit }: Props)', 'variant, sites, hit, motionBank, motionFlameLength, motionHullLight }: Props)'],
  ['  const className = variant === "player" ? "player-engine" : "exhaust";','  const className = variant === "player" ? "player-engine" : "exhaust";\n  const motion = motionBank === undefined ? null : enemyMotionStyles(motionBank, motionFlameLength ?? "0%", motionHullLight ?? 0);'],
  ['    <div className="ship-visual">','    <div className="ship-visual" data-direct-enemy-motion={motion ? "true" : undefined} style={motion?.visual}>'],
  ['className={`${className} ship-thruster`} style={style}', 'className={`${className} ship-thruster`} style={motion ? {...style,...motion.engine} : style}'],
  ['style={{ maskImage, WebkitMaskImage: maskImage }}', 'style={{ maskImage, WebkitMaskImage: maskImage, ...motion?.reflection }}'],
 ]);
 return condition==='candidate'?'import {enemyMotionStyles} from '+JSON.stringify(folder+'/presentation.ts')+';\n'+changed:source;
}
export const REDUCED_CSS = '\n@media(prefers-reduced-motion:reduce){.game-field .cryptoid .ship-visual[data-direct-enemy-motion="true"]{transform:rotate(180deg) perspective(420px) rotateY(0deg)!important;}}\nhtml[data-motion="reduced"] .game-field .cryptoid .ship-visual[data-direct-enemy-motion="true"]{transform:rotate(180deg) perspective(420px) rotateY(0deg)!important;}\n';
export function prepareBase(source) {
 const hook="    const path = id.split('?')[0];";
 return edits(source,[[hook,hook+'\n    if(path === root+\'/frontend/src/pages/GameShipVisual.tsx\') return shipVisualTransform(code);']]);
}
export function adaptMuzzleBuilder(source,condition) {
 assert.equal(blob(source),'86aa7a42e94237b04741d6609266fa90ead1b9f2');
 assert.ok(['control','candidate'].includes(condition));
 const url=new URL('./transform.mjs',import.meta.url);url.searchParams.set('condition',condition);
 return edits(source,[
  ["import { transformController, proof, digest } from './transform.mjs';",'import {transformController,proof,digest,prepareBase} from '+JSON.stringify(url.href)+';'],
  ["const transformUrl = pathToFileURL(root + '/verification/player-muzzle-local-20261104/transform.mjs').href;",'const transformUrl = '+JSON.stringify(url.href)+';'],
  ['proof as muzzleProof }','proof as muzzleProof, visual as shipVisualTransform }'],
  ['prefix + replaceOnce(base, before, after)','prefix + replaceOnce(prepareBase(base), before, after)'],
 ]);
}
export function adaptCriticalBuilder(source,condition) {
 const url=pathToFileURL(folder+'/transform.mjs').href;
 return 'import {adaptMuzzleBuilder as adaptEnemyMuzzleBuilder} from '+JSON.stringify(url)+';\n'+edits(source,[
  ["const builder = readFileSync(builderPath, 'utf8');",
   "const builder = adaptEnemyMuzzleBuilder(readFileSync(builderPath, 'utf8'), "+JSON.stringify(condition)+");"],
 ]);
}
export function adaptDeviceBuilder(source,condition) {
 assert.equal(blob(source),'f45a54c137867e48b2f77585f8ea3d50e95edfcf');
 assert.ok(['control','candidate'].includes(condition));
 const url=pathToFileURL(folder+'/transform.mjs').href;
 return 'import {adaptCriticalBuilder} from '+JSON.stringify(url)+';\n'+edits(source,[
  ['const adapted = adaptJournalBuild(source);','const adapted = adaptCriticalBuilder(adaptJournalBuild(source),'+JSON.stringify(condition)+');'],
 ]);
}
