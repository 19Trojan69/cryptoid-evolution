import assert from 'node:assert/strict';
import { instrumentController, instrumentBossDamage } from './fixture.mjs';

export const deviceSeed = `
  const deviceSeededRef = useRef(false);
  useLayoutEffect(() => {
    if (deviceSeededRef.current) return;
    deviceSeededRef.current = true;
    const options = (window as any).__deviceBossOptions;
    const state = stateRef.current;
    state.sector = 20; state.section = 20; state.chainBlocks = 9;
    state.phase = 'SECTOR_INTRO'; state.encounter = 'boss-intro'; state.status = 'paused';
    state.boss = createSectorBoss(20, fieldRef.current?.clientWidth || 390,
      visibleTopRef.current, fieldRef.current?.clientHeight || 700);
    if (options?.scene === 'reactor') {
      for (const gun of state.boss.turrets) gun.health = 0;
      state.boss.health = state.boss.maxHealth / 2;
    }
    if (options?.protection) impactCooldownRef.current = 1e9;
    setGame({ ...state });
  }, []);
  useEffect(() => {
    if (game.sector !== 20 || !game.encounter.startsWith('boss')) return;
    const release = (window as any).__deviceWarmRelease;
    if (typeof release !== 'function') return;
    // Existing hull-plan effects acquire their pins in this same passive pass.
    // Retire the menu lease after that pass, without a game timer or RAF.
    void Promise.resolve().then(() => {
      if ((window as any).__deviceWarmRelease === release) delete (window as any).__deviceWarmRelease;
      (window as any).__deviceWarmHandoff = false;
      release();
    });
  }, [game.sector, game.encounter]);
`;

export function deviceController(source) {
  const anchor = '  const levelLabel =';
  const instrumented = instrumentController(source);
  assert.equal(instrumented.split(anchor).length, 2);
  const transformed = instrumented.replace(anchor, deviceSeed + '\n' + anchor);
  assert.equal(transformed.replace(deviceSeed + '\n', ''), instrumented);
  return transformed;
}
export const deviceBoss = instrumentBossDamage;

export function deviceHtml(source) {
  const sdk = '<script src="https://sdk.minepi.com/pi-sdk.js"></script>';
  assert.equal(source.split(sdk).length, 2);
  return source.replace(sdk, '<script src="/device-preview-sdk.js"></script>')
    .replace(/backendURL:\s*"[^"]*"/, 'backendURL: "/api"')
    .replace(/appNetwork:\s*"[^"]*"/, 'appNetwork: "testnet"')
    .replace('<title>Cryptoid Evolution</title>', '<title>Cryptoid Evolution · Privater Boss-2-Test</title>');
}
