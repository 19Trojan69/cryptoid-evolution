import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { cardBackgroundAssets, collectionBackground, cardBackgroundAsset } from './cardBackgrounds.ts';
import { ownedCollectionHulls, guestCollectionHulls } from './collectionOwnership.ts';
import { SHIP_FLEET_KEY, playerSkins } from './shipFleet.ts';
import { availableShipCards } from './cardRevealRules.ts';
import { createSectorBoss } from './sectorBoss.ts';
import { bossWeapons } from './bossWeapons.ts';
import { weaponCanvasSize } from './bossWeaponRenderer.ts';
import { wrapCardText } from './cardTextLayout.ts';

test('110 stable background destinations; existing assets and incomplete work counted separately', () => {
  assert.equal(cardBackgroundAssets.length, 110);
  assert.equal(new Set(cardBackgroundAssets.map(a => a.cardKey)).size, 110);
  assert.equal(new Set(cardBackgroundAssets.map(a => a.plannedImage)).size, 110);
  assert.deepEqual(['boss','standard','advanced','elite'].map(c => cardBackgroundAssets.filter(a => a.category === c).length), [50,20,20,20]);
  const ready = cardBackgroundAssets.filter(a => a.image);
  // This deliberately reports the actual shortfall, not 110 "completed" placeholder paths.
  assert.equal(ready.length, 75);
  assert.equal(cardBackgroundAssets.filter(a => !a.image).length, 35);
  const hashes = ready.map(a => createHash('sha256').update(fs.readFileSync(new URL(`../../public${a.image}`, import.meta.url))).digest('hex'));
  assert.equal(new Set(hashes).size, ready.length);
  for (const a of cardBackgroundAssets) assert.ok(fs.existsSync(new URL(`../../public${collectionBackground(a.cardKey)}`, import.meta.url)));
  for (const ship of playerSkins) assert.equal(new Set([1,2,3].map(stage => cardBackgroundAsset(`${ship.id}-${stage}`).plannedImage)).size, 3);
  assert.throws(() => collectionBackground('not-a-card'));
});

test('guest collection reads purchased local hulls and the free starter, never fabricated used history', () => {
  const storage = { getItem: key => key === SHIP_FLEET_KEY ? JSON.stringify({'solar-lance':{gold:1},'nova-wing':{silver:0}}) : null };
  assert.deepEqual(guestCollectionHulls(storage).sort(), ['grey-scout', 'solar-lance']);
  assert.deepEqual(ownedCollectionHulls({'solar-lance':{gold:0},'nova-wing':{silver:2}}), ['nova-wing']);
  assert.deepEqual(availableShipCards(playerSkins, {}, ['solar-lance'], []), []);
  const cards = availableShipCards(playerSkins, {'solar-lance':{gold:1},'core-carrier':{gold:1}}, ['core-carrier'], ['ship_20_stage_2','ship_20_stage_3']);
  assert.deepEqual(cards.map(c=>c.key), ['solar-lance-1']);
});

test('all 50 current bosses and all rotated mounted weapon sprites fit the composite source canvas', () => {
  let count = 0;
  for (let id=1; id<=50; id++) {
    const boss=createSectorBoss(id*10,768,0,1200), viewport=weaponCanvasSize(boss), scale=boss.width/boss.config.sourceWidth;
    assert.equal(boss.config.id,id); assert.equal(boss.turrets.length,bossWeapons[id-1].length);
    for (let i=0;i<boss.turrets.length;i++) {
      count++;
      const gun=bossWeapons[id-1][i], angle=boss.turrets[i].a;
      const x=viewport.padX+gun.sourceX/boss.config.sourceWidth*boss.width;
      const y=viewport.padY+gun.sourceY/boss.config.sourceHeight*boss.height;
      for (const kind of ['sprite','shadow']) {
        const px=-gun.spritePivot.x*scale+(kind==='shadow'?-9*scale:0),py=-gun.spritePivot.y*scale+(kind==='shadow'?-6*scale:0);
        for (const dx of [0,gun[kind].width*scale/2]) for (const dy of [0,gun[kind].height*scale/2]) {
          const X=x+(px+dx)*Math.cos(angle)-(py+dy)*Math.sin(angle),Y=y+(px+dx)*Math.sin(angle)+(py+dy)*Math.cos(angle);
          assert.ok(X>=0&&Y>=0&&X<=viewport.width&&Y<=viewport.height, `Boss ${id} turret ${i}: clipped ${kind}`);
        }
      }
    }
  }
  assert.equal(count,392);
});

test('PNG text wrapping includes long words, unicode and paragraphs without losing characters', () => {
  const text='Geschützpanzerungsübertragungsprotokoll 🚀 Unicode\nSecond paragraph with complete technical data.';
  const lines=wrapCardText(text,12,line=>[...line].length);
  assert.ok(lines.every(line=>[...line].length<=12));
  assert.equal(lines.join('').replace(/\s/g,''),text.replace(/\s/g,''));
  assert.throws(()=>wrapCardText('test',0,s=>s.length));
});
