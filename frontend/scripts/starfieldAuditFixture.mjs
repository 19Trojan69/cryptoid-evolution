// Optional native-browser audit, never imported by the application or build.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASELINE = '19de3e692f75a1c3e2eddf3438acc937c9dcac19';
const frontend = process.env.CRYPTOID_STARFIELD_FRONTEND || resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const auditNodeModules = process.env.CRYPTOID_AUDIT_NODE_MODULES || join(frontend, 'node_modules');

export function prepareStarfieldFixture() {
  const baseline = process.env.CRYPTOID_STARFIELD_BASELINE_FILE
    ? readFileSync(process.env.CRYPTOID_STARFIELD_BASELINE_FILE)
    : execFileSync('git', ['show', BASELINE + ':frontend/src/pages/Starfield.tsx'], { cwd: frontend });
  const hash = createHash('sha1').update('blob ' + baseline.length + '\0').update(baseline).digest('hex');
  if (hash !== '1b2715d4ee1dc6c5e93c19695d728ea9134b6631') throw new Error('Unexpected baseline Starfield blob');
  const root = mkdtempSync(join(tmpdir(), 'cryptoid-starfield-audit-')) + '/';
  mkdirSync(root + 'full-scene-source/frontend/src/pages', { recursive: true });
  mkdirSync(root + 'full-scene-source/frontend/src/lib', { recursive: true });
  mkdirSync(root + 'candidate-source');
  writeFileSync(root + 'full-scene-source/frontend/src/pages/Starfield.tsx', baseline);
  const candidate = readFileSync(process.env.CRYPTOID_STARFIELD_CANDIDATE_FILE || join(frontend, 'src/pages/Starfield.tsx'));
  writeFileSync(root + 'candidate-source/Starfield-safe-clip.tsx', candidate);
  for (const file of ['cssFramePacing.ts', 'nativeFrameEasing.ts']) {
    writeFileSync(root + 'full-scene-source/frontend/src/lib/' + file, readFileSync(join(frontend, 'src/lib', file)));
  }
  const styles = ['index.css', 'mobileMenus.css', 'floatingNotices.css', 'quickAccessMobile.css',
    'missionDialogMobile.css', 'homeTypeMobile.css', 'mobileDeepMenus.css', 'hudDepth.css',
    'locales/typography.css', 'selectionControls.css', 'fleetMenus.css', 'smartphoneUi.css', 'pages/feedbackCompact.css'];
  writeFileSync(root + 'full-scene-global.css', styles.map(p => readFileSync(join(frontend, 'src', p), 'utf8')).join('\n'));
  console.log('Local audit output: ' + root);
  return root;
}

export function nativeBrowserTools(moduleUrl) {
  const require = createRequire(moduleUrl);
  const current = require(process.env.CRYPTOID_AUDIT_PLAYWRIGHT || 'playwright');
  const compat = process.env.CRYPTOID_AUDIT_CHROMIUM_PLAYWRIGHT
    ? require(process.env.CRYPTOID_AUDIT_CHROMIUM_PLAYWRIGHT) : current;
  return { current, compat, launchBrowser: engine => {
    const type = engine === 'webkit' ? current.webkit : compat.chromium;
    const executablePath = process.env['CRYPTOID_AUDIT_' + engine.toUpperCase() + '_EXECUTABLE'];
    return type.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  } };
}
