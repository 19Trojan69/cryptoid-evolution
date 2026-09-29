import { test } from "node:test";
import assert from "node:assert/strict";
import { arrangeFormationBySize, BLOCK_FORMATION_NAMES, formationLayout, formationReady, formationSlotsForCount, reinforcementCount, SECTION_INTRO_MS, sectionPhase, sectorForSection, sectionInSector, sectorName, sectorChapter, campaignLevel, sectorInChapter } from "./sectorManager.ts";
import { chooseCryptoid } from "./cryptoidRoster.ts";

test("all planned enemies must spawn and die before an endless section advances", () => {
  const stage = { introMs: SECTION_INTRO_MS, spawned: 5, total: 6, alive: 0, ready: 0, returning: false, attacking: false };
  assert.equal(sectionPhase(stage), "ENTRY");
  assert.equal(sectionPhase({ ...stage, spawned: 6, alive: 1, ready: 1 }), "FORMATION");
  assert.equal(sectionPhase({ ...stage, spawned: 6, alive: 1, ready: 1, attacking: true }), "ATTACK_CYCLE");
  assert.equal(sectionPhase({ ...stage, spawned: 6, alive: 1, ready: 1, returning: true }), "REFORM");
  assert.equal(sectionPhase({ ...stage, spawned: 6 }), "SECTOR_CLEAR");
  assert.equal(sectionPhase({ ...stage, spawned: 6, introMs: 0 }), "SECTOR_INTRO");
});

test("combat waits until every surviving enemy occupies its formation slot", () => {
  assert.equal(formationReady({ spawned: 5, total: 6, alive: 5, ready: 5 }), false);
  assert.equal(formationReady({ spawned: 6, total: 6, alive: 6, ready: 5 }), false);
  assert.equal(formationReady({ spawned: 6, total: 6, alive: 6, ready: 6 }), true);
  assert.equal(formationReady({ spawned: 6, total: 6, alive: 0, ready: 0 }), false);
});

test("nine normal blocks have nine distinct fixed formations, repeated next level", () => {
  assert.deepEqual(BLOCK_FORMATION_NAMES, ["Ranks", "V", "W", "Ring", "Wave", "X", "A", "Columns", "Diamond"]);
  for (const width of [375, 390, 800, 1200]) {
    const formations = Array.from({ length: 9 }, (_, block) => formationLayout(1, width, 700, block + 1));
    const signatures = formations.map(slots => slots.map(slot => `${Math.round(slot.x)}:${Math.round(slot.y)}`).join(";"));
    assert.equal(new Set(signatures).size, 9, `${width}px must show nine formations`);
    assert.deepEqual(formationLayout(31, width, 700, 11).map(({ x, y }) => [x, y]), formations[0].map(({ x, y }) => [x, y]));
    for (const [block, slots] of formations.entries()) {
      assert.equal(slots.length, 6);
      assert.ok(slots.every(slot => slot.y > 65 && slot.y < 700 * (width < 760 ? .45 : .5) && slot.x >= 50 && slot.x <= width - 50), `block ${block + 1}: safe playfield`);
      const radii = slots.map((_, index) => chooseCryptoid(block + 1, index).radius);
      const arranged = arrangeFormationBySize(slots, radii);
      const largest = radii.indexOf(Math.max(...radii));
      assert.equal(arranged[largest].x, width / 2, `block ${block + 1}: largest ship in center`);
      for (let index = 0; index < arranged.length; index++) for (let other = index + 1; other < arranged.length; other++) {
        const clearance = Math.hypot(arranged[index].x - arranged[other].x, arranged[index].y - arranged[other].y) - radii[index] - radii[other];
        assert.ok(clearance >= 4, `${width}px block ${block + 1}: hulls ${index} and ${other} overlap by ${-clearance}`);
      }
    }
  }
});

test("late blocks gain four to six additional ships in a second flight", () => {
  assert.deepEqual([1, 7, 9, 10, 97, 98, 99, 100, 197, 297, 497].map(reinforcementCount), [0, 0, 0, 0, 4, 4, 4, 0, 5, 6, 6]);
  for (const width of [320, 375, 390, 800]) for (const sector of [97, 98, 99, 197, 198, 199, 297, 298, 299]) {
    const count = reinforcementCount(sector);
    const slots = formationSlotsForCount(formationLayout(sector, width, 700), count);
    const radii = slots.map((_, index) => chooseCryptoid(sector, index + 6).radius);
    const arranged = arrangeFormationBySize(slots, radii);
    assert.equal(arranged.length, count, `only ${count} occupied targets in block ${sector}`);
    assert.equal(arranged[radii.indexOf(Math.max(...radii))].x, width / 2);
    for (let index = 0; index < arranged.length; index++) for (let other = index + 1; other < arranged.length; other++) {
      const clearance = Math.hypot(arranged[index].x - arranged[other].x, arranged[index].y - arranged[other].y) - radii[index] - radii[other];
      assert.ok(clearance >= 4, `${width}px block ${sector}: ships ${index} and ${other} overlap by ${-clearance}`);
    }
  }
});

test("large enemies receive central slots while smaller enemies move to the sides", () => {
  const slots = formationLayout(1, 390, 700);
  const sizes = [25, 36, 25, 50, 36, 25];
  const arranged = arrangeFormationBySize(slots, sizes);
  const centerX = slots.reduce((sum, slot) => sum + slot.x, 0) / slots.length;
  const order = sizes.map((size, index) => ({ size, distance: Math.abs(arranged[index].x - centerX) }))
    .sort((a, b) => b.size - a.size);
  for (let index = 1; index < order.length; index += 1) assert.ok(order[index - 1].distance <= order[index].distance);
});

test("each section is one block and ten slots share one named level", () => {
  assert.deepEqual([1, 2, 3, 4, 18, 19].map(sectorForSection), [1, 2, 3, 4, 18, 19]);
  assert.deepEqual([1, 2, 3, 4].map(sectionInSector), [1, 1, 1, 1]);
  assert.equal(sectorName(10), "GENESIS BELT");
  assert.equal(sectorName(11), "CRYSTAL CHAIN");
  assert.equal(sectorName(51), "QUANTUM VAULT");
  assert.equal(sectorName(61), "GENESIS BELT 2");
  assert.equal(sectorChapter(500), 49);
  assert.deepEqual([1, 9, 10, 11, 20].map(campaignLevel), [1, 1, 1, 2, 2]);
  assert.deepEqual([1, 9, 10, 11, 20].map(sectorInChapter), [1, 9, 10, 1, 10]);
  assert.equal(sectorForSection(901), 901);
});
