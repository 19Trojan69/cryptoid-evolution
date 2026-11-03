import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { selectRuntime } from './nativeMemory.mjs';

assert.equal(process.platform, 'darwin', 'Native macOS runner required');
const output = resolve(process.argv[2]); mkdirSync(output, { recursive: true });
const execute = (command, args, timeout = 45000) => execFileSync(command, args,
  { encoding: 'utf8', timeout, maxBuffer: 2 ** 20 }).trim();
const inventory = JSON.parse(execute('xcrun', ['simctl', 'list', '--json']));
const runtime = selectRuntime(inventory.runtimes);
assert.ok(runtime, 'The preinstalled, pinned iOS 26.2 simulator runtime is required; no download or desktop fallback');
const deviceType = inventory.devicetypes.find(d => d.identifier === 'com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro-Max');
assert.ok(deviceType);
const udid = execute('xcrun', ['simctl', 'create', 'Cryptoid isolated Safari lab', deviceType.identifier, runtime.identifier]);
const result = { version: 1, physicalDevice: false, runtime, deviceType, udid,
  hostOS: execute('sw_vers', []), hostArchitecture: execute('uname', ['-m']),
  hostMemoryBytes: Number(execute('sysctl', ['-n', 'hw.memsize'])),
  xcode: execute('xcodebuild', ['-version']), safariDriver: execute('/usr/bin/safaridriver', ['--version']),
  nativeAccountRequired: false, paidServiceEnabled: false, booted: false };
writeFileSync(resolve(output, 'simulator.json'), JSON.stringify(result, null, 2) + '\n');
console.log('CRYPTOID_IOS_PREFLIGHT ' + JSON.stringify(result));
execute('xcrun', ['simctl', 'boot', udid]);
execute('xcrun', ['simctl', 'bootstatus', udid, '-b'], 240000);
execute('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', udid]);
result.booted = true;
writeFileSync(resolve(output, 'simulator.json'), JSON.stringify(result, null, 2) + '\n');
console.log('CRYPTOID_IOS_SIMULATOR_READY ' + JSON.stringify(result));
