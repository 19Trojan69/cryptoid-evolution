import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE = '7433e560c2fd8575a501997d290157f3e3b2005f'
before = lambda name: subprocess.check_output(['git', 'show', BASE + ':' + name], cwd=ROOT)
current = lambda name: (ROOT / name).read_bytes()
rock = 'frontend/src/pages/BonusRockLayer.tsx'
restored_rock = current(rock).decode().replace("import { gameRenderScale } from './renderResolution';\n", '').replace(
    'const dpr=gameRenderScale(window.devicePixelRatio);', 'const dpr=Math.min(1.5,window.devicePixelRatio||1);')
assert restored_rock.encode() == before(rock)
assert b'Math.min(1, deviceRatio)' in current('frontend/src/pages/renderResolution.ts')
runtime = [p for p in subprocess.check_output(['git', 'diff', '--name-only', BASE], cwd=ROOT, text=True).splitlines()
           if p.startswith('frontend/src/') and not p.endswith('test.mjs')]
assert set(runtime) == {rock, 'frontend/src/pages/renderResolution.ts'}, runtime
assert not subprocess.check_output(['git', 'diff', '--name-only', BASE, '--', 'backend', 'api'], cwd=ROOT)
protected = [
    'frontend/src/pages/GamePage.tsx', 'frontend/src/pages/CanvasEffects.tsx',
    'frontend/src/pages/BossWeaponsView.tsx', 'frontend/src/pages/bossWeaponRenderer.ts',
    'frontend/src/pages/bossExplosionBudget.ts', 'frontend/src/pages/gameLoop.ts',
    'frontend/src/pages/projectilePresentation.ts', 'frontend/src/lib/frameScheduler.ts',
    'frontend/src/pages/gameAudio.ts', 'frontend/src/pages/GameHudStats.tsx',
    'frontend/src/pages/LevelCompletion.tsx', 'frontend/src/pages/HomeEarthNetwork.tsx',
    'frontend/src/pages/HomeCombatPreview.tsx', 'frontend/src/pages/shipFleet.ts',
    'frontend/src/pages/normalEffectArtwork.ts', 'frontend/src/pages/normalEffectBounds.mjs',
    'frontend/src/pages/normalEffectMath.mjs', 'frontend/src/lib/accountSave.ts',
    'frontend/src/pages/SystemSettings.tsx', 'frontend/src/pages/displaySettings.ts',
    'frontend/src/generated/paintedHullManifest.ts', 'frontend/src/index.css',
    'frontend/src/cockpitMenus.css', 'frontend/yarn.lock',
]
hashes = {}
for name in protected:
    assert current(name) == before(name), name
    hashes[name] = hashlib.sha256(current(name)).hexdigest()
record = {'baseline': BASE, 'changedRuntimeFiles': runtime, 'protectedSourcesSha256': hashes,
          'backendUnchanged': True, 'noNewTimerFrameListenerStateOrUi': True,
          'fractionOfPriorUnroundedBackingPixels': (1 / 1.5) ** 2,
          'physicalTemperatureMeasured': False, 'historicalWhiteScreenFixed': False}
(Path(__file__).parent / 'results/scope.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({'scopeVerified': True, 'changedRuntimeFiles': runtime, 'protectedFiles': len(hashes)}))
