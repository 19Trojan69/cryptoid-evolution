import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const baseline='92f392e2efe5608a7d589e2d14c2593a2626c5bb';
const before=execFileSync('git',['show',baseline+':frontend/src/pages/GamePage.tsx'],{encoding:'utf8'});
let after=fs.readFileSync(new URL('../src/pages/GamePage.tsx',import.meta.url),'utf8');
const replace=(from,to='')=>{assert.equal(after.split(from).length-1,1,'exactly one reviewed observation block: '+from.slice(0,100));after=after.replace(from,to);};
for(const line of [
 '      bossBoundary?.finish();',
 '      const boundary = bossBoundaryRef.current;',
 "      boundary?.clearMark(stateRef.current.sector, 'boss-victory-ended');",
 "      boundary?.clearMark(stateRef.current.sector, 'boss-music-return-source-set');",
 "    if (ownerDiagnostics) bossBoundaryRef.current?.clearMark(stateRef.current.sector, 'boss-victory-source-set');",
 '    if (ownerDiagnostics) bossBoundaryRef.current?.clearStart(state.sector);',
 "          if (ownerDiagnostics && clearFinished && state.encounter === 'boss-clear') bossBoundaryRef.current?.clearMark(state.sector, 'boss-clear-timer-ready');",
 "            if (ownerDiagnostics) bossBoundaryRef.current?.clearMark(state.sector, 'boss-heart-collected');",
 "            if (ownerDiagnostics) bossBoundaryRef.current?.clearMark(state.sector, 'boss-extra-life-audio-returned');",
 "            if (ownerDiagnostics && state.encounter === 'boss-clear') bossBoundaryRef.current?.clearStop();",
])replace(line+'\n');
replace(`      if (stateRef.current.status === "playing") {
        const playback = track.play();
        if (boundary) {
          boundary.clearMark(stateRef.current.sector, 'boss-music-return-play-returned');
          boundary.clearPlayback(stateRef.current.sector, 'boss-music-return-play-settled', playback);
        }
      }`, '      if (stateRef.current.status === "playing") void track.play();');
replace(`    if (!track) {
      if (ownerDiagnostics) bossBoundaryRef.current?.clearMark(stateRef.current.sector, 'boss-victory-no-track');
      return;
    }`, '    if (!track) return;');
replace(`    const playback = track.play();
    if (ownerDiagnostics) {
      bossBoundaryRef.current?.clearMark(stateRef.current.sector, 'boss-victory-play-returned');
      bossBoundaryRef.current?.clearPlayback(stateRef.current.sector, 'boss-victory-play-settled', playback);
    }`, '    void track.play();');
assert.equal(after,before,'complete GamePage matches released source after removing only reviewed observations');
console.log(JSON.stringify({passed:true,baseline,wholeGamePagePreserved:true,checks:['unchanged JSX and styles','unchanged simulation, timers and rewards','same ordered music/audio calls without awaiting or retrying','no new media objects, event listeners or periodic timers']}));
