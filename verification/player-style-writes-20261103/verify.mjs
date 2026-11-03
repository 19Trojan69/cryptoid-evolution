import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { setChangedPlayerProperty, properties, transformPlayerStyles, sourceBlob } from './candidate.mjs';

const [rootArg, outputArg] = process.argv.slice(2);
const root = resolve(rootArg), output = resolve(outputArg);
mkdirSync(output, { recursive: true });
const source = readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8');
const candidate = transformPlayerStyles(source);
assert.throws(() => transformPlayerStyles(source + '\n'), /frozen controller/);
assert.equal(source.includes('setChangedPlayerProperty'), false);
assert.equal(candidate.split('function setChangedPlayerProperty(').length, 2);
assert.equal(properties.length, 4);
const sha256 = s => createHash('sha256').update(s).digest('hex');
const require = createRequire(resolve(process.env.RUNNER_TEMP, 'cryptoid-player-style-tools/package.json'));
assert.equal(require('playwright/package.json').version, '1.62.1');
const { chromium, webkit } = require('playwright');
const result = { version: 1, complete: false, sourceBlob, originalSha256: sha256(source),
  virtualCandidateSha256: sha256(candidate), sourceGameFilesEdited: false,
  fullGameRun: false, physicalDevice: false, nativeMemoryMeasured: false,
  performanceGainMeasured: false, whiteScreenFixed: false, cases: [] };
const fixture = `<!doctype html><meta charset="utf-8"><style>
  .ship {position:relative;width:90px;height:110px;--flame-length:20%;--visual-bank:0deg;--hull-light:0;--muzzle-light:0}
  .flame {height:var(--flame-length);width:8px}
  .bank {transform:rotate(var(--visual-bank));width:30px;height:20px}
  .hull {opacity:var(--hull-light)} .muzzle {opacity:var(--muzzle-light)}
  </style><main><div class="ship" id="control"><i class="flame"></i><i class="bank"></i><i class="hull"></i><i class="muzzle"></i></div><div class="ship" id="candidate"><i class="flame"></i><i class="bank"></i><i class="hull"></i><i class="muzzle"></i></div></main>`;
try {
  for (const [engine, type] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await type.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 430, height: 825 }, deviceScaleFactor: 3 });
      await page.route('**/*', route => route.abort());
      await page.setContent(fixture);
      await page.addScriptTag({ content: setChangedPlayerProperty.toString() });
      const cases = await page.evaluate(({ properties }) => {
        const control = document.querySelector('#control'), candidate = document.querySelector('#candidate');
        const same = (a, b, reason) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw Error(reason + ': ' + JSON.stringify({ a, b })); };
        const snapshot = node => ({
          declarations: properties.map(name => [name, node.style.getPropertyValue(name), node.style.getPropertyPriority(name)]),
          consumers: [...node.children].map(child => { const c = getComputedStyle(child); return { height: c.height, opacity: c.opacity, transform: c.transform }; }),
        });
        const apply = values => {
          let writes = 0;
          for (let i = 0; i < properties.length; i++) {
            control.style.setProperty(properties[i], values[i]);
            if (setChangedPlayerProperty(candidate.style, properties[i], values[i])) writes++;
          }
          same(snapshot(control), snapshot(candidate), 'Inline declarations and computed consumers must match');
          return writes;
        };
        const observers = [control, candidate].map(node => {
          const observer = new MutationObserver(() => {});
          observer.observe(node, { attributes: true, attributeFilter: ['style'] });
          return observer;
        });
        const nativeMutations = () => observers.map(observer => observer.takeRecords().length);
        const rows = [];
        let writes = 0;
        for (let i = 0; i < 1000; i++) writes += apply(['20%', '0deg', '.5', '0']);
        if (writes !== 4) throw Error('The idle sequence must make exactly four actual writes');
        rows.push({ case: '1000-identical-input-updates', controlWrites: 4000, candidateWrites: writes,
          nativeStyleMutations: nativeMutations(), computedConsumersEqual: true });
        writes = 0;
        for (let i = 0; i < 360; i++) writes += apply([`${20 + i / 100}%`, `${(i - 180) / 13}deg`, String(i / 360), String((i % 19) / 20)]);
        rows.push({ case: '360-changing-input-updates', controlWrites: 1440, candidateWrites: writes,
          nativeStyleMutations: nativeMutations(), computedConsumersEqual: true });
        // Native priority, external inline mutations, inherited values and
        // remounts are the counterexamples to a stale last-written cache.
        for (const scenario of ['important', 'external-write', 'remove-inline', 'remount']) {
          const a = document.createElement('div'), b = document.createElement('div');
          a.className = b.className = 'ship'; document.body.append(a, b);
          let actual = 0;
          for (const name of properties) {
            const value = name.endsWith('length') ? '27%' : name.endsWith('bank') ? '7deg' : '.7';
            for (const n of [a, b]) {
              if (scenario === 'important') n.style.setProperty(name, value, 'important');
              else if (scenario === 'external-write') n.style.setProperty(name, 'initial');
              else if (scenario === 'remove-inline') { n.style.setProperty(name, value); n.style.removeProperty(name); }
            }
            a.style.setProperty(name, value);
            if (setChangedPlayerProperty(b.style, name, value)) actual++;
          }
          same(snapshot(a), snapshot(b), scenario);
          if (actual !== 4) throw Error('All externally changed or new declarations must be written: ' + scenario);
          a.remove(); b.remove();
          rows.push({ case: scenario, candidateWrites: actual, inlineValueAndPriorityEqual: true });
        }
        same(snapshot(control), snapshot(candidate), 'Earlier declarations must remain unaffected');
        for (const observer of observers) observer.disconnect();
        return rows;
      }, { properties });
      result.cases.push({ engine, browserVersion: browser.version(), cases });
      console.log('CRYPTOID_PLAYER_STYLE_CASES ' + JSON.stringify(result.cases.at(-1)));
      await page.close();
    } finally { await browser.close(); }
  }
  result.complete = true;
} catch (error) {
  result.error = { name: error.name, message: error.message };
  throw error;
} finally {
  assert.equal(readFileSync(root + '/frontend/src/pages/GamePage.tsx', 'utf8'), source);
  writeFileSync(output + '/receipt.json', JSON.stringify(result, null, 2) + '\n');
  console.log('CRYPTOID_PLAYER_STYLE_RESULT ' + JSON.stringify(result));
}
