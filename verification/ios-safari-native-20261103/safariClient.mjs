import assert from 'node:assert/strict';

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export class SafariClient {
  constructor(origin = 'http://127.0.0.1:4444') { this.origin = origin; this.session = null; }
  async request(method, path, body, timeout = 90000) {
    const response = await fetch(this.origin + path, { method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
    const result = await response.json();
    if (!response.ok || result.value?.error) throw Error('WebDriver ' + (result.value?.error || response.status)
      + ': ' + String(result.value?.message || '').slice(0, 2000));
    return result.value;
  }
  async start(udid) {
    const value = await this.request('POST', '/session', { capabilities: { alwaysMatch: {
      browserName: 'Safari', platformName: 'iOS', 'appium:automationName': 'XCUITest',
      'appium:udid': udid, 'appium:deviceName': 'iPhone 16 Pro Max', 'appium:platformVersion': '26.2',
      'appium:nativeWebTap': true, 'appium:safariGarbageCollect': false,
      'appium:skipLogCapture': true, 'appium:disableAutomaticScreenshots': true,
      'appium:waitForIdleTimeout': 1, 'appium:wdaStartupRetries': 1,
      'appium:wdaLaunchTimeout': 120000, 'appium:newCommandTimeout': 120
    } } }, 360000);
    assert.ok(value.sessionId); this.session = value.sessionId;
    assert.equal(String(value.capabilities.platformName).toLowerCase(), 'ios', 'Never silently fall back to desktop Safari');
    return value.capabilities;
  }
  command(method, path, body) {
    assert.ok(this.session); return this.request(method, '/session/' + this.session + path, body);
  }
  execute(script, args = []) { return this.command('POST', '/execute/sync', { script, args }); }
  async waitFor(check, label, timeout = 45000) {
    const started = Date.now();
    while (Date.now() - started < timeout) { const value = await check(); if (value) return value; await delay(250); }
    throw Error('Timed out: ' + label);
  }
  async click(selector) {
    const element = await this.waitFor(async () => {
      const values = await this.command('POST', '/elements', { using: 'css selector', value: selector });
      for (const item of values) {
        const id = item['element-6066-11e4-a52e-4f735466cecf'];
        if (await this.command('GET', '/element/' + id + '/displayed')
          && await this.command('GET', '/element/' + id + '/enabled')) return id;
      }
      return false;
    }, selector);
    // The native WebDriver click produces the ordinary single-finger activation.
    // No JavaScript click(), event dispatch or game state assignment is used.
    await this.command('POST', '/element/' + element + '/click', {});
  }
  async clickButton(text) {
    assert.ok(!text.includes('"'), 'This harness uses exact button labels without double quotes');
    const id = await this.waitFor(async () => {
      const elements = await this.command('POST', '/elements', { using: 'xpath',
        value: '//button[normalize-space(.)=' + JSON.stringify(text) + ']' });
      if (!elements.length) return false;
      assert.equal(elements.length, 1, 'One exact native button: ' + text);
      const id = elements[0]['element-6066-11e4-a52e-4f735466cecf'];
      return await this.command('GET', '/element/' + id + '/displayed')
        && await this.command('GET', '/element/' + id + '/enabled') ? id : false;
    }, text);
    await this.command('POST', '/element/' + id + '/click', {});
  }
  async close() {
    if (!this.session) return;
    try { await this.command('DELETE', ''); } finally { this.session = null; }
  }
}
