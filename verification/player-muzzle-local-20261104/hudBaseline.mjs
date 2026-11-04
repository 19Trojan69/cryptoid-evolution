import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';

export const HUD_RULE='@media (max-width:700px){.game-hud{backdrop-filter:none;}}';
export function applyMobileHudCandidate(root, directory) {
  assert.equal(process.env.VERCEL_ENV,'preview','Only the authorized separate guest preview');
  const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest(readFileSync(resolve(root,'frontend/src/index.css'))),
    'cf48ca4553ac7fa425f37e84a334acc3fec2f2163b72d31bfe9b35f7d33c27b5','Frozen original game CSS');
  const collect=dir=>{
    const files=new Map();
    const visit=folder=>{for(const item of readdirSync(folder,{withFileTypes:true})){
      const path=resolve(folder,item.name);
      if(item.isDirectory())visit(path);
      else files.set(relative(dir,path),digest(readFileSync(path)));
    }};
    visit(dir);return files;
  };
  const before=collect(directory);
  const infoPath=resolve(directory,'device-preview-info.json');
  const htmlPath=resolve(directory,'index.html');
  const info=JSON.parse(readFileSync(infoPath,'utf8'));
  assert.equal(info.guestOnly,true);
  for(const name of ['liveBackend','actualPiAuthentication','payments','automaticUpload','automaticResume'])
    assert.equal(info[name],false,name);
  assert.equal(info.diagnosticStopwatch.stateSha256,'5e5845d5e5beef85ca5dadac597b8d751e81f931374b942b22fdedc7d83bbb5c');
  assert.equal(info.directStyleDeviceCandidate.activeFrameProbeIncluded,false);
  assert.equal(info.directStyleDeviceCandidate.activeClockTraceIncluded,false);
  const html=readFileSync(htmlPath,'utf8');
  const id='cryptoid-mobile-hud-candidate';
  assert.equal(html.split('</head>').length,2);
  assert.ok(!html.includes(id),'Apply the single treatment only once');
  const style='<style id="'+id+'">'+HUD_RULE+'</style>';
  const treated=html.replace('</head>',style+'</head>');
  assert.equal(treated.replace(style,''),html,'No other HTML change');
  info.mobileHudBackdropCandidate={version:1,id:'mobile-hud-20261103',ownerAuthorized:true,
    baselineSourceCommit:'ac98e95166b0e2013186257904da46323840dab5',
    originalSourceCssSha256:'cf48ca4553ac7fa425f37e84a334acc3fec2f2163b72d31bfe9b35f7d33c27b5',
    onlyProperty:'backdrop-filter',maxWidthCssPixels:700,value:'none',rule:HUD_RULE,
    sourceGameFilesEdited:false,gameJavaScriptEdited:false,externalCssFilesEdited:false,
    diagnosticClockStateEdited:false,newGameTimers:false,newGameCollectors:false,
    automaticResume:false,physicalDeviceAccepted:false,whiteScreenFixed:false,
    baselineHtmlSha256:digest(html),candidateHtmlSha256:digest(treated),
    equivalentCssPatch:'verification/mobile-hud-cascade-20261103/mobile-hud-cascade.patch',
    browserFunctionalEvidenceRun:41626481637,cssCascadeEvidenceRun:41624042675};
  writeFileSync(htmlPath,treated);
  writeFileSync(infoPath,JSON.stringify(info,null,2)+'\n');
  const after=collect(directory);
  assert.deepEqual([...after.keys()].sort(),[...before.keys()].sort(),'No new executable or asset files');
  const changed=[...before].filter(([name,sha])=>after.get(name)!==sha).map(([name])=>name).sort();
  assert.deepEqual(changed,['device-preview-info.json','index.html']);
  for(const [name,sha] of before)if(/\.(?:js|css)$/.test(name))
    assert.equal(after.get(name),sha,'Every original JS/CSS byte stays identical: '+name);
  console.log('CRYPTOID_MOBILE_HUD_CANDIDATE '+JSON.stringify({sourceCommit:info.sourceCommit,
    changedOutputFiles:changed,originalScriptsAndStylesUnchanged:true,...info.mobileHudBackdropCandidate}));
  return info.mobileHudBackdropCandidate;
}
