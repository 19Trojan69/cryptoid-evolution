import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reactorHeatColor} from '../../frontend/src/pages/reactorHeat.ts';
import {BOSS_REACTOR_BURST_MS,BOSS_DESCENT_MS,BOSS_DEFEAT_MS} from '../../frontend/src/pages/bossDefeatTiming.ts';
test('reactor burst precedes the complete original descent and all final timers use the combined duration',()=>{
 assert.equal(BOSS_REACTOR_BURST_MS,650);assert.equal(BOSS_DESCENT_MS,5000);assert.equal(BOSS_DEFEAT_MS,5650);
 const source=readFileSync(new URL('../../frontend/src/pages/GamePage.tsx',import.meta.url),'utf8');
 assert.match(source,/const BOSS_FALL_DURATION_MS = BOSS_DEFEAT_MS;/);
 assert.match(source,/const finalDelayMs = BOSS_FALL_DURATION_MS;/);
 assert.match(source,/clearTimerRef.current >= BOSS_FALL_DURATION_MS/);
 assert.match(source,/BOSS_VICTORY_START_MS = BOSS_FALL_DURATION_MS \+ 650/);
});
test('core heat changes only below half health and progresses towards brighter yellow',()=>{
 for(const h of [100,75,50,0,-1,NaN])assert.equal(reactorHeatColor(h,100),undefined);
 assert.equal(reactorHeatColor(5,0),undefined);
 const colors=[49,40,25,10,1].map(h=>reactorHeatColor(h,100));assert.equal(new Set(colors).size,5);
 let previous=0;for(const color of colors){const [r,g,b]=color.match(/\d+/g).map(Number);assert.equal(r,255);assert.ok(g>previous);assert.ok(b>=15&&b<=120);previous=g;}
});
