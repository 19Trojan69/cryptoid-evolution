import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectilePresentation } from './projectilePresentation.ts';

function host() {
  let writes = 0;
  const document = { createElement() {
    const properties = new Map();
    const style = new Proxy({ setProperty(key, value) { writes++; properties.set(key, value); } }, {
      set(target, key, value) { writes++; target[key] = value; return true; },
    });
    return { ownerDocument: document, children: [], style, properties, className: '',
      appendChild(node) { this.children.push(node); node.parent = this; },
      remove() { const list = this.parent?.children; if (list) list.splice(list.indexOf(this), 1); },
    };
  } };
  const mount = document.createElement(), presenter = createProjectilePresentation(mount);
  return { mount, presenter, get writes() { return writes; } };
}
const player = (id = 1) => ({ id, x: 100, y: 200, speedX: .1, damage: 1, empowered: false });
const hostile = (id = 2) => ({ id, x: 150, y: 120, vx: .1, vy: .2, radius: 4 });

test('live positions use every supplied frame while preserving styles and node identity', () => {
  const h = host(), state = { shots: [player()], enemyShots: [hostile()] };
  h.presenter.present(state);
  const a = h.mount.children[0].children[0], b = h.mount.children[1].children[0];
  for (let frame = 0; frame < 120; frame++) {
    state.shots[0].x += 1; state.shots[0].y -= 2;
    state.enemyShots[0].y += 3;
    h.presenter.present(state);
    assert.equal(h.mount.children[0].children[0], a);
    assert.equal(h.mount.children[1].children[0], b);
    assert.equal(a.style.translate, `${state.shots[0].x}px ${state.shots[0].y}px`);
    assert.equal(b.style.translate, `${state.enemyShots[0].x}px ${state.enemyShots[0].y}px`);
  }
  assert.equal(a.className, 'player-laser player-laser-tier-1');
  assert.equal(b.className, 'enemy-laser');
  assert.equal(a.style.left, '0px'); assert.equal(a.style.top, '0px');
  assert.equal(a.style.transform, undefined, 'authored CSS still owns centering/rotation');
  const writes = h.writes;
  for (let frame = 0; frame < 60; frame++) h.presenter.present(state);
  assert.equal(h.writes, writes, 'paused unchanged shots do not rewrite the DOM');
});

test('equipment/class changes and reused IDs reset dimensions and preserve every projectile variant', () => {
  const h = host(), shot = hostile();
  for (const enemyClass of ['light', 'medium', 'heavy', 'elite', undefined]) {
    Object.assign(shot, { enemyClass });
    h.presenter.present({ shots: [], enemyShots: [shot] });
    const node = h.mount.children[1].children[0];
    assert.equal(node.properties.get('width'), enemyClass ? '8px' : '');
    assert.equal(node.properties.get('height'), ['medium', 'heavy'].includes(enemyClass) ? '8px' : '');
  }
  for (let visualLevel = 1; visualLevel <= 5; visualLevel++) for (const empowered of [false, true]) {
    h.presenter.present({ shots: [{ ...player(), visualLevel, empowered }], enemyShots: [] });
    assert.equal(h.mount.children[0].children[0].className,
      `player-laser player-laser-tier-${visualLevel}${empowered && visualLevel !== 5 ? ' player-laser-overdrive' : ''}`);
  }
  for (const bossKind of ['bolt','orb','lance','split','pulse','double','burst','heavy','rapid']) {
    h.presenter.present({ shots: [], enemyShots: [{ ...shot, bossKind, weaponKind: 'laser', weaponColor: '#abcdef', weaponWidth: 7 }] });
    const node = h.mount.children[1].children[0];
    assert.equal(node.className, `enemy-laser boss-projectile boss-projectile-${bossKind} boss-evolved-shot boss-evolved-laser`);
    assert.equal(node.properties.get('--boss-shot-width'), '7px');
    assert.equal(node.properties.get('--boss-shot-color'), '#abcdef');
  }
  h.presenter.present({ shots: [], enemyShots: [hostile()] });
  assert.equal(h.mount.children[1].children[0].properties.get('--boss-shot-color'), '');
});

test('hit/clear removals are immediate and thousands of volleys retain only live nodes', () => {
  const h = host();
  for (let id = 0; id < 6000; id++) {
    h.presenter.present({ shots: [player(id)], enemyShots: [hostile(id)] });
    assert.equal(h.presenter.size, 2);
    assert.equal(h.mount.children[0].children.length, 1);
    assert.equal(h.mount.children[1].children.length, 1);
  }
  h.presenter.present({ shots: [], enemyShots: [] });
  assert.equal(h.presenter.size, 0);
  assert.equal(h.mount.children[0].children.length, 0);
  assert.equal(h.mount.children[1].children.length, 0);
  h.presenter.dispose();
  assert.equal(h.mount.children.length, 0);
});


test('moving locked-direction shots calculate their angle only once until an actual appearance change', () => {
  const h = host(), shot = hostile();
  const atan2 = Math.atan2; let angles = 0;
  Math.atan2 = (...args) => { angles++; return atan2(...args); };
  try {
    for (let frame = 0; frame < 600; frame++) {
      h.presenter.present({ shots: [], enemyShots: [{ ...shot, x: shot.x + frame, y: shot.y + frame }] });
    }
    assert.equal(angles, 1);
    shot.vx = -.2; h.presenter.present({ shots: [], enemyShots: [shot] });
    assert.equal(angles, 2);
    const node = h.mount.children[1].children[0];
    assert.equal(node.properties.get('--shot-angle'), `${-atan2(shot.vx, shot.vy) * 180 / Math.PI}deg`);
    shot.weaponKind = 'laser'; shot.weaponColor = '#abcdef'; shot.weaponWidth = 8; shot.radius = 6;
    h.presenter.present({ shots: [], enemyShots: [shot] });
    assert.equal(node.properties.get('--boss-shot-diameter'), '12px');
    assert.equal(node.properties.get('--boss-shot-width'), '8px');
    shot.weaponColor = '#fedcba'; shot.weaponWidth = 9;
    h.presenter.present({ shots: [], enemyShots: [shot] });
    assert.equal(node.properties.get('--boss-shot-color'), '#fedcba');
    assert.equal(node.properties.get('--boss-shot-width'), '9px');
  } finally { Math.atan2 = atan2; h.presenter.dispose(); }
});
