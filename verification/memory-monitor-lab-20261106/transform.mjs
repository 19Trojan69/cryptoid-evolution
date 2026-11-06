import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const BASE_RUNTIME='d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d';
export const EXPECTED_CONTROLLER='4867dfeb5a00944736abbc3d5667b1d83850593e';
export const LAB_PROJECT='prj_0uk2EWyJzzKfIHoLUMrDZMaJZY4W';
// This hostname has no "testnet" substring. Select the same gameplay branch
// explicitly before any module reads window.__ENV; transport stays local.
export function labHtml(html){
  const sdk='<script src="https://sdk.minepi.com/pi-sdk.js"></script>';
  assert.equal(html.split(sdk).length,2);
  assert.equal((html.match(/appNetwork:\s*"[^"]*"/g)||[]).length,1);
  assert.equal((html.match(/backendURL:\s*"[^"]*"/g)||[]).length,1);
  const out=html.replace(sdk,'<script src="/lab-sdk.js"></script>').replace(/backendURL:\s*"[^"]*"/,'backendURL: "/api"').replace(/appNetwork:\s*"[^"]*"/,'appNetwork: "testnet"').replace('<title>Cryptoid Evolution</title>','<title>Cryptoid Evolution · Speicherlabor</title>');
  assert.ok(out.includes('appNetwork: "testnet"'));assert.ok(!out.includes('$$APP_NETWORK$$'));
  return out;
}
export const hook=`
  const labCounters = useRef({activeMs:0,unobservedGapMs:0,frames:0});
  const labSeeded = useRef(false);
  useLayoutEffect(() => {
    if(labSeeded.current)return;
    labSeeded.current=true;
    const options=(window as any).__cryptoidLabOptions;
    const s=stateRef.current;s.status='paused';
    if (options?.scene && options.scene !== 'normal') {
      s.sector=20;s.section=20;s.chainBlocks=9;s.phase='SECTOR_INTRO';s.encounter='boss-intro';s.status='paused';
      s.boss=createSectorBoss(20,fieldRef.current?.clientWidth||390,visibleTopRef.current,fieldRef.current?.clientHeight||760);
      if(options.scene==='reactor'){s.boss.turrets.forEach(g=>g.health=0);s.boss.health=s.boss.maxHealth*.55;}
    }
    if(options?.protection)impactCooldownRef.current=1e9;
    setGame({...s});
  }, []);
  useEffect(() => {
    const read=()=>{
      const s=stateRef.current,p=paintedShipResourceStats(),c=canvasEffectResources(),a=soundRef.current?.diagnosticResourceStats;
      const pacing=cssFramePacingStats(),boss=s.boss;
      const heap=(performance as any).memory?.usedJSHeapSize;
      const canvases=Array.from(document.getElementsByTagName('canvas'));
      return {...labCounters.current,rulesMode:combatVarietyEnabled?'current':'legacy',status:s.status,phase:s.phase,encounter:s.encounter,stage:s.sector,level:campaignLevel(s.sector),
        bossId:boss?.config.id??null,reactorPercent:boss?boss.health/boss.maxHealth*100:null,liveTurrets:boss?boss.turrets.filter(g=>g.health>0).length:null,
        frameMs:lastMeasuredFrameRef.current,enemies:s.asteroids.length,playerShots:s.shots.length,enemyShots:s.enemyShots.length,effects:s.effects.length,
        domNodes:document.getElementsByTagName('*').length,canvasNodes:canvases.length,domCanvasLogicalBytes:canvases.reduce((n,c)=>n+c.width*c.height*4,0),
        paintedBytes:p.estimatedBytes,paintedEntries:p.painted,canvasCacheBytes:c.cacheBytes,canvasSurfaceBytes:c.surfaceBytes,
        audioBufferBytes:a?.audioBufferBytes??null,audioVoices:a?.audioVoices??null,pacedActive:pacing.active,pacedConfigured:pacing.configured,
        heapBytes:typeof heap==='number'&&Number.isFinite(heap)?heap:null};
    };
    (window as any).__cryptoidLabRead=read;
    return ()=>{if((window as any).__cryptoidLabRead===read)delete (window as any).__cryptoidLabRead;};
  }, []);
  useEffect(()=>{
    const scene=(window as any).__cryptoidLabOptions?.scene;
    if(scene!=='normal'&&game.sector!==20)return;
    const release=(window as any).__cryptoidLabWarmRelease;
    if(typeof release!=='function')return;
    void Promise.resolve().then(()=>{
      if((window as any).__cryptoidLabWarmRelease===release)delete (window as any).__cryptoidLabWarmRelease;
      (window as any).__cryptoidLabWarmHandoff=false;release();
    });
  },[game.sector,game.encounter]);
`;
export const frameAnchor="      frameGap = frame.wallMs; simulatedMs = 0; forceScene = false; requestScene = false;";
export const frameHook=`
      labCounters.current.frames++;
      if(wasPlaying){
        if(lastMeasuredFrameRef.current<=1000)labCounters.current.activeMs+=lastMeasuredFrameRef.current;
        else labCounters.current.unobservedGapMs+=lastMeasuredFrameRef.current;
      }`;
export function controller(source) {
  const bytes=Buffer.from(source);
  assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex'),EXPECTED_CONTROLLER);
  const anchor='  const levelLabel =';
  assert.equal(source.split(anchor).length,2);assert.equal(source.split(frameAnchor).length,2);
  const result=source.replace(anchor,hook+'\n'+anchor).replace(frameAnchor,frameAnchor+frameHook);
  assert.equal(result.replace(hook+'\n','').replace(frameHook,''),source);
  return result;
}
