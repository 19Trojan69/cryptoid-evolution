import test from 'node:test';
import assert from 'node:assert/strict';
import { contactWithBoss } from './bossContact.ts';
import { contactWithEnemy, placePlayer } from './playerCombat.ts';
import { createSectorBoss, moveSectorBoss } from './sectorBoss.ts';

test('wide boss no longer hits upper player limit far below its visible hull', () => {
  const width=709,height=1100;
  const boss=moveSectorBoss(createSectorBoss(30,width,80,height),1800,width,height);
  const player=placePlayer(width/2,height*.5,width,height);
  assert.ok(player.y*height>boss.y+boss.height/2+27);
  assert.equal(contactWithEnemy(player,width,height,boss,true,false,0,boss,player).damage,1);
  assert.equal(contactWithBoss(player,width,height,boss,0).damage,0);
});

test('boss hull contact, swept motion and protection cooldown remain effective', () => {
  const boss={x:200,y:120,width:280,height:100};
  assert.equal(contactWithBoss({x:.5,y:.15},400,800,boss,0).damage,1);
  assert.equal(contactWithBoss({x:.5,y:.15},400,800,boss,100).damage,0);
  assert.equal(contactWithBoss({x:.9,y:.15},400,800,boss,0,boss,{x:.1,y:.15}).damage,1);
  assert.equal(contactWithBoss({x:.5,y:.5},400,800,boss,0).connected,false);
});

test('defeated boss cannot damage a player inside its former hull', () => {
  const boss={x:200,y:120,width:280,height:100,health:0};
  assert.deepEqual(contactWithBoss({x:.5,y:.15},400,800,boss,0),{connected:false,damage:0});
});

test('all 50 bosses stay harmless outside their swept rendered vertical extent', () => {
  for(const [width,height] of [[390,760],[709,1100],[844,390]]) {
    for(let level=10;level<=500;level+=10) {
      let boss=createSectorBoss(level,width,80,height);
      for(let frame=0;frame<350;frame++) {
        const previous=boss;boss=moveSectorBoss(boss,16,width,height);
        const player=placePlayer(width/2,height*.5,width,height);
        if(player.y*height>Math.max(previous.y+previous.height/2,boss.y+boss.height/2)+27)
          assert.equal(contactWithBoss(player,width,height,boss,0,previous,player).damage,0);
      }
    }
  }
});
