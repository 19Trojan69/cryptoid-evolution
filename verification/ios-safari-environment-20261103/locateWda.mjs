import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function locateWda(driverPackagePath) {
  // This is project-data discovery, not a CommonJS import. Recent WDA packages
  // export only an ESM entry, so require.resolve(packageName) cannot locate it.
  const lookup = createRequire(driverPackagePath).resolve.paths('appium-webdriveragent');
  for (const base of lookup ?? []) {
    const root = resolve(base, 'appium-webdriveragent');
    if (!existsSync(root)) continue;
    const metadata = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    assert.equal(metadata.name, 'appium-webdriveragent');
    assert.ok(existsSync(resolve(root, 'WebDriverAgent.xcodeproj')), 'Installed WDA must contain its Xcode project');
    assert.equal(typeof metadata.version, 'string');
    return { root, version: metadata.version };
  }
  throw Error('No installed WebDriverAgent project in the XCUITest driver dependency search paths');
}
