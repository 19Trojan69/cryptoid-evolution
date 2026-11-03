import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { locateWda } from './locateWda.mjs';

test('discovers nested and hoisted ESM-only WDA without a require export', () => {
  for (const hoisted of [false, true]) {
    const root = mkdtempSync(resolve(tmpdir(), 'cryptoid-wda-fixture-'));
    try {
      const driver = resolve(root, 'node_modules/appium-xcuitest-driver');
      mkdirSync(driver, { recursive: true });
      const parent = resolve(driver, 'package.json');
      writeFileSync(parent, JSON.stringify({ name: 'appium-xcuitest-driver', type: 'module' }));
      const wda = resolve(hoisted ? root : driver, 'node_modules/appium-webdriveragent');
      mkdirSync(resolve(wda, 'WebDriverAgent.xcodeproj'), { recursive: true });
      writeFileSync(resolve(wda, 'package.json'), JSON.stringify({ name: 'appium-webdriveragent',
        version: '16.17.2', type: 'module', exports: { '.': { import: './index.js' } } }));
      assert.throws(() => createRequire(parent).resolve('appium-webdriveragent'),
        { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
      assert.deepEqual(locateWda(parent), { root: wda, version: '16.17.2' });
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
});

test('rejects a discovered package without its Xcode project', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'cryptoid-wda-incomplete-'));
  try {
    const driver = resolve(root, 'node_modules/appium-xcuitest-driver');
    const wda = resolve(driver, 'node_modules/appium-webdriveragent');
    mkdirSync(wda, { recursive: true });
    const parent = resolve(driver, 'package.json');
    writeFileSync(parent, '{}');
    writeFileSync(resolve(wda, 'package.json'), JSON.stringify({ name: 'appium-webdriveragent', version: '16.17.2' }));
    assert.throws(() => locateWda(parent), /must contain its Xcode project/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
