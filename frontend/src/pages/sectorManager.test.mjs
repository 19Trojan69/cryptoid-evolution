import { test } from "node:test";
import assert from "node:assert/strict";
import { formationLayout, SECTION_INTRO_MS, sectionPhase, sectorForSection, sectionInSector, sectorName } from "./sectorManager.ts";

test("all planned enemies must spawn and die before an endless section advances", () => {
  const stage = { introMs: SECTION_INTRO_MS, spawned: 5, total: 6, alive: 0, ready: 0, returning: false, attacking: false };
  assert.equal(sectionPhase(stage), "ENTRY");
  assert.equal(sectionPhase({ ...stage, spawned: 6, alive: 1, ready: 1 }), "FORMATION");
  assert.equal(sectionPhase({ ...stage, spawned: 6, alive: 1, ready: 1, attacking: true }), "ATTACK_CYCLE");
  assert.equal(sectionPhase({ ...stage, spawned: 6, alive: 1, ready: 1, returning: true }), "REFORM");
  assert.equal(sectionPhase({ ...stage, spawned: 6 }), "SECTOR_CLEAR");
  assert.equal(sectionPhase({ ...stage, spawned: 6, introMs: 0 }), "SECTOR_INTRO");
});

test("formation slots are unique and occupy ordered rows in the upper field", () => {
  for (const [width, height, expected] of [[375, 700, 6], [1200, 800, 15]]) {
    const slots = formationLayout(1, width, height);
    assert.equal(slots.length, expected);
    assert.equal(new Set(slots.map(slot => `${slot.x}:${slot.y}`)).size, expected);
    assert.ok(slots.every(slot => slot.y < height * .45 && slot.x > 40 && slot.x < width - 40));
    assert.equal(new Set(slots.map(slot => slot.row)).size, expected === 6 ? 2 : 3);
  }
});

test("neighbouring ships have room for their complete silhouettes", () => {
  for (const [width, height] of [[390, 700], [720, 800], [800, 700], [1200, 800]]) {
    const slots = formationLayout(1, width, height);
    for (const slot of slots) for (const other of slots) {
      if (slot.index === other.index) continue;
      assert.ok(Math.hypot(slot.x - other.x, slot.y - other.y) >= 100, `${width}x${height}: slots ${slot.index} and ${other.index} overlap`);
    }
  }
});

test("three sections share a named sector and sector names repeat indefinitely", () => {
  assert.deepEqual([1, 2, 3, 4, 18, 19].map(sectorForSection), [1, 1, 1, 2, 6, 7]);
  assert.deepEqual([1, 2, 3, 4].map(sectionInSector), [1, 2, 3, 1]);
  assert.equal(sectorName(6), "QUANTUM VAULT");
  assert.equal(sectorName(7), "GENESIS BELT 2");
  assert.equal(sectorForSection(901), 301);
});
