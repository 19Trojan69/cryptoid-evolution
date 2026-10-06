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
   assert.ok(a.width>=14&&a.x-a.width/2>=0&&a.x+a.width/2<=boss.width);
   assert.ok(a.height>=2&&a.height<=3);
   assert.ok(a.y>=5&&a.y<=boss.height-5);
   for(const b of bars.slice(i+1))assert.ok(Math.abs(a.x-b.x)>=a.width+4||Math.abs(a.y-b.y)>=11,`overlap boss ${id} at ${width}: ${a.index}/${b.index}`);
  }
  boss.turrets[0].health=0;
  assert.deepEqual(turretBarPositions(boss),bars);
 }
});

test('dense bosses get shorter and thinner bars with a small total footprint',()=>{
 let sparse=0,dense=0;
 for(let id=1;id<=50;id++){
  const boss=createSectorBoss(id*10,390,90,760), bars=turretBarPositions(boss), n=bars.length;
  if(n<=4){sparse++;assert.equal(bars[0].height,3);}
  if(n>12){dense++;assert.ok(bars[0].width<=16);assert.equal(bars[0].height,2);}
  assert.ok(bars.reduce((sum,b)=>sum+(b.width+2)*(b.height+2),0)/(boss.width*boss.height)<.06);
 }
 assert.ok(sparse>0&&dense>0);
});
