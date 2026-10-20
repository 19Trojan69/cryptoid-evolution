// Read-only audit of the real source with controlled audio/transition hosts.
// This is NOT native Web Audio, browser rendering, or an iPhone crash replay.
// Historical pre-diagnostic audit: run against runtime 53640c0. Its final parity
// assertion intentionally rejects later diagnostic/source changes. See results.json.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { GameAudio } from '../../frontend/src/pages/gameAudio.ts';
import { MusicPlayer } from '../../frontend/src/pages/musicPlayback.ts';
import { advanceAfterClear } from '../../frontend/src/pages/sectorBoss.ts';
import { combatCryptoid } from '../../frontend/src/pages/combatVariety.ts';
import { formationSlotsForCount, formationLayout, formationBelowHud, arrangeFormationBySize } from '../../frontend/src/pages/sectorManager.ts';

const root = new URL('../../', import.meta.url).pathname;
const require = createRequire(root + 'frontend/package.json');
const ts = require('typescript');
const { build } = require('esbuild');
const results = { sourceCommit: execFileSync('git', ['rev-parse','HEAD'], {cwd:root, encoding:'utf8'}).trim(),
  limits: 'Controlled hosts execute actual source. Dropped ended events are injected faults, not observed WebKit behavior. No native/GPU memory, presented FPS, heat, or crash cause is measured.' };
const contexts = [], encoded = new WeakMap();
let deliverEnded = true;
const parameter = () => ({value:1,setValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(v){this.value=v;}});
const node = () => ({gain:parameter(),pan:parameter(),connect(out){return out;},disconnect(){this.disconnected=true;}});
globalThis.localStorage = {getItem:()=>null};
globalThis.fetch = async url => ({ok:true,arrayBuffer:async()=>{
  const data=new ArrayBuffer(1);
  const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',root+'frontend/public'+url],{encoding:'utf8'}));
  encoded.set(data,duration); return data;
}});
globalThis.AudioContext = class {
  state='running';currentTime=0;sampleRate=48000;destination={};sources=[];resumes=0;suspends=0;closes=0;
  constructor(){contexts.push(this);}
  createGain(){return node();}
  createStereoPanner(){return node();}
  createMediaElementSource(){return node();}
  createBuffer(channels,length,sampleRate){const data=new Float32Array(length);return {length,numberOfChannels:channels,duration:length/sampleRate,copyToChannel(a){data.set(a);},getChannelData(){return data;}};}
  async decodeAudioData(data){const duration=encoded.get(data);return {duration,length:Math.round(duration*this.sampleRate),numberOfChannels:1};}
  createBufferSource(){return this.source(false);}
  createOscillator(){return this.source(true);}
  source(oscillator){const context=this,s={...node(),frequency:parameter(),playbackRate:parameter(),onended:null,
    start(at=context.currentTime){this.started=true;this.ends=oscillator?Infinity:at+this.buffer.duration/this.playbackRate.value;},
    stop(at=context.currentTime){this.ends=Math.min(this.ends??Infinity,at);}};
    context.sources.push(s);return s;}
  async resume(){this.resumes++;this.state='running';}
  async suspend(){this.suspends++;this.state='suspended';}
  async close(){this.closes++;this.state='closed';}
  advance(seconds){this.currentTime+=seconds;for(const s of this.sources)if(s.started&&!s.delivered&&s.ends<=this.currentTime&&deliverEnded){s.delivered=true;s.onended?.();}}
};
globalThis.Audio = class {
  paused=true;ended=false;currentTime=0;duration=180;listeners=new Map();loads=0;plays=0;
  constructor(src){this.src=src;}
  addEventListener(k,fn){if(!this.listeners.has(k))this.listeners.set(k,new Set());this.listeners.get(k).add(fn);}
  removeEventListener(k,fn){this.listeners.get(k)?.delete(fn);}
  pause(){this.paused=true;}
  async play(){this.plays++;this.paused=false;}
  load(){this.loads++;this.currentTime=0;}
  removeAttribute(){this.src='';}
};
const turn=()=>new Promise(resolve=>setImmediate(resolve));
async function audioReady(volume=35){const audio=new GameAudio();audio.setEffectsVolume(volume);await audio.start();await turn();return audio;}
async function audioCase(ended){deliverEnded=ended;const audio=await audioReady();const ctx=contexts.at(-1);let max=0;
  for(let i=0;i<3000;i++){ctx.advance(.2);audio.play(i%2?'explosion':'enemyHit');if(i%10===0)audio.playEnemyShot(0,'heavy','double');max=Math.max(max,audio.activeVoiceCount);}
  ctx.advance(30);const retainedAfterCompletion=audio.activeVoiceCount;
  audio.setEffectsVolume(0);const sourceCount=ctx.sources.length;
  for(let i=0;i<100;i++){audio.play('extraLife');audio.playEnemyShot();}
  assert.equal(ctx.sources.length,sourceCount);
  const retainedAfterMute=audio.activeVoiceCount;
  audio.setPaused(true);const retainedAfterPause=audio.activeVoiceCount;
  audio.close();assert.equal(audio.activeVoiceCount,0);
  if(ended){assert.equal(retainedAfterCompletion,0);assert.ok(max<20);}
  else {assert.equal(retainedAfterCompletion,3300);assert.equal(retainedAfterMute,3300);assert.equal(retainedAfterPause,300);}
  return {sounds:3300,simulatedSeconds:630,maxRegisteredVoices:max,retainedAfterCompletion,retainedAfterMute,retainedAfterPause,retainedAfterClose:audio.activeVoiceCount};
}
results.healthyEnded=await audioCase(true);
results.injectedMissingEnded=await audioCase(false);
deliverEnded=true;
const muted=await audioReady(0);const mutedCtx=contexts.at(-1);
assert.equal(mutedCtx.sources.length,0);assert.equal(muted.diagnosticResourceStats.audioSampleBuffers,46);
results.effectsMutedFromStart={contexts:1,state:mutedCtx.state,cachedBuffers:46,sourceNodes:0};muted.close();

const music=new MusicPlayer('/audio/battle-orbit.mp3',50);await music.play();const musicCtx=contexts.at(-1);
music.setVolume(0);assert.equal(music.playing,true);assert.equal(music.audio.paused,false);assert.equal(musicCtx.suspends,0);
const beforeSwitchContexts=contexts.length,element=music.audio;
for(let i=0;i<2000;i++){music.setSource(i%2?'/audio/battle-orbit.mp3':'/audio/dreadnought-duel.mp3');await music.play();}
assert.equal(contexts.length,beforeSwitchContexts);assert.equal(music.audio,element);
results.music={zeroVolumeStillPlaying:music.playing,suspendedAtZero:musicCtx.suspends,trackSwitches:2000,additionalContexts:contexts.length-beforeSwitchContexts};
music.close();assert.equal(musicCtx.closes,1);

// Execute cardSound as well: this third context is outside GameAudio statistics.
const cardBundle=await build({entryPoints:[root+'frontend/src/pages/cardSound.ts'],bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent'});
const cardBox={AudioContext:globalThis.AudioContext,localStorage:globalThis.localStorage,exports:{},module:{exports:{}}};cardBox.module.exports=cardBox.exports;
vm.runInNewContext(cardBundle.outputFiles[0].text,cardBox);const beforeCard=contexts.length;
for(let i=0;i<1000;i++)cardBox.module.exports.primeCardSound();
assert.equal(contexts.length-beforeCard,1);results.cardContext={contextsAdded:1,resumeCalls:contexts.at(-1).resumes,diagnosticCoverage:false,closeOrSuspendExport:false};

// Extract and run the ACTUAL clear->intro body and actual formation builder.
const source=fs.readFileSync(root+'frontend/src/pages/GamePage.tsx','utf8');
const ast=ts.createSourceFile('GamePage.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const find=(n,p)=>{if(p(n))return n;let result;ts.forEachChild(n,c=>{result??=find(c,p);});return result;};
const variable=name=>find(ast,n=>ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text===name);
const compile=code=>ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const musicEffect=find(ast,n=>ts.isCallExpression(n)&&n.expression.getText(ast)==='useEffect'&&n.arguments[0]?.getText(ast).includes('const normalSource ='));
assert.ok(musicEffect);
const normalMusic=new MusicPlayer('/audio/battle-orbit.mp3',50);await normalMusic.play();
const musicScope=vm.createContext({musicRef:{current:normalMusic},musicEnabled:true,bossVictoryPendingRef:{current:false},bossVictoryFinishedRef:{current:false},regularMusicPositionRef:{current:0}});
const musicUpdate=vm.runInContext(compile('('+musicEffect.arguments[0].getText(ast)+')'),musicScope);
for(let sector=71;sector<=74;sector++){musicScope.game={sector,status:'playing',encounter:'normal'};musicUpdate();}
await turn();assert.equal(normalMusic.audio.loads,0);
results.normalMusicTransition={actualMusicEffectExecutions:4,sectors:[71,72,73,74],sourceLoads:0,dependencies:musicEffect.arguments[1].getText(ast)};
normalMusic.close();
const scope=vm.createContext({combatVarietyEnabled:true,chooseCryptoid:combatCryptoid,formationSlotsForCount,formationLayout,formationBelowHud,arrangeFormationBySize,advanceAfterClear,
  width:430,height:825,visibleTop:80,playerDiameterRef:{current:94},performanceProbeRef:{current:null},ownerDiagnostics:false,
  intro:{},setGame(){},soundRef:{current:{play(){throw Error('normal clear must not play a new sound');}}},createSectorBoss(){throw Error('not a boss transition');}});
for(const name of ['bossLifeRemaining','sectionSlots','bossEscortSlots','bossEscortWave','bossEscortSpawned','bossEscortTimer','waveComplete','formationIndex','formationStarted','flight','formationOffset','bonusIndex','spawnTimer','sectionElapsed','clearTimer','attackCooldown','dropsCreated'])scope[name+'Ref']={current:0};
scope.createFormationSlots=vm.runInContext(compile('('+variable('createFormationSlots').initializer.getText(ast)+')'),scope);
const clearVar=variable('clearEncounter');const body=clearVar.parent.parent.parent;
assert.ok(ts.isBlock(body));const start=body.statements.findIndex(s=>s.getText(ast).includes('const clearEncounter ='));
assert.ok(start>=0);const code=body.statements.slice(start).map(s=>s.getText(ast)).join('\n');
const transition=vm.runInContext(compile('(()=>{'+code+'})'),scope);
for(let i=0;i<5000;i++){
  const sector=[73,71,72,74,75,76,77,78][i%8];
  scope.state={section:sector,sector,encounter:'normal',combo:{pendingAt:2,level:0},powerUps:[],effects:[{}],shots:[{}],enemyShots:[{}]};
  transition();assert.equal(scope.state.sector,sector+1);assert.equal(scope.state.encounter,'normal');assert.equal(scope.state.phase,'SECTOR_INTRO');assert.equal(scope.state.effects.length,0);
  assert.equal(scope.sectionSlotsRef.current.length,6);assert.ok(scope.sectionSlotsRef.current.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)));
}
results.transitions={actualClearBodyExecutions:5000,sectors:[71,72,73,74,75,76,77,78],target:'73 -> 74 included',newSoundCalls:0,finiteFormationSlots:true,
  limits:'State/formation body only; excludes React mount, native image decode, browser Canvas, audio hardware and rendering.'};
const mp3s=fs.readdirSync(root+'frontend/public/audio').filter(name=>name.endsWith('.mp3'));
for(const name of mp3s)execFileSync('ffmpeg',['-v','error','-xerror','-i',root+'frontend/public/audio/'+name,'-f','null','-'],{stdio:'pipe'});
results.mediaFiles={decodedWithoutError:mp3s.length,decoder:'ffmpeg host, not WebKit'};
execFileSync('git',['diff','--exit-code','53640c01a16c921645d05502d9e5b34f6dc6eeec','--','frontend/src','frontend/public','frontend/package.json','frontend/package-lock.json'],{cwd:root,stdio:'pipe'});
results.runtimeParity={approvedRuntime:'53640c01a16c921645d05502d9e5b34f6dc6eeec',sourceAndAssetsUnchanged:true};
console.log(JSON.stringify(results,null,2));
