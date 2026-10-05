import test from 'node:test';
import assert from 'node:assert/strict';
import { createSectorBoss } from './sectorBoss.ts';
import { turretBarPositions } from './bossHealthLayout.ts';

test('all turret bars remain separated, in bounds and stable after a kill on phones and desktops',()=>{
 for(const [width,height] of [[320,568],[390,760],[1366,768]])for(let id=1;id<=50;id++){
  const boss=createSectorBoss(id*10,width,90,height);
  const bars=turretBarPositions(boss);
  assert.equal(bars.length,boss.turrets.length);
  for(const [i,a] of bars.entries()){
   assert.ok(a.width>=24&&a.x-a.width/2>=0&&a.x+a.width/2<=boss.width);
   assert.ok(a.y>=5&&a.y<=boss.height-5);
   for(const b of bars.slice(i+1))assert.ok(Math.abs(a.x-b.x)>=a.width+4||Math.abs(a.y-b.y)>=11,`overlap boss ${id} at ${width}: ${a.index}/${b.index}`);
  }
  boss.turrets[0].health=0;
  assert.deepEqual(turretBarPositions(boss),bars);
 }
});
