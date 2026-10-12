import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { communityLocale, communityLanguages, translationKey, translationChunks, translateCommunity } = require('../build/communityTranslation.js');
const response = text => ({ ok: true, json: async () => ({ responseStatus: 200, responseData: { translatedText: text } }) });
test('device locale normalization supports all app languages and rejects arbitrary targets', () => {
  assert.equal(communityLanguages.size, 19);
  for (const language of communityLanguages) assert.equal(communityLocale(language), language);
  assert.equal(communityLocale('de-AT'), 'de');
  assert.equal(communityLocale('ZH-cn'), 'zh');
  for (const value of ['', undefined, ['de'], 'ar', 'bogus']) assert.equal(communityLocale(value), null);
});
test('long CJK, emoji and word-based text keeps all characters within provider byte limit', () => {
  for (const text of ['这是一个测试😀。'.repeat(230), 'A whole sentence with words and paragraphs.\n'.repeat(150), '👨‍🚀'.repeat(400)]) {
    const chunks = translationChunks(text);
    assert.equal(chunks.join(''), text);
    assert.ok(chunks.length > 1);
    assert.ok(chunks.every(chunk => Buffer.byteLength(chunk) <= 450));
    assert.ok(chunks.every(chunk => !/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(chunk)));
  }
  assert.deepEqual(translationChunks(''), []);
});
test('cache identity changes with network, edit, reply and target language', () => {
  const base = translationKey('testnet', 'post', 'de', ['Title', 'Body']);
  for (const args of [['mainnet','post','de',['Title','Body']], ['testnet','post','es',['Title','Body']], ['testnet','reply','de',['Title','Body']], ['testnet','post','de',['Title','Edited']]]) assert.notEqual(translationKey(...args), base);
});
test('same-language and empty text avoid provider calls', async () => {
  const forbidden = () => { throw Error('unexpected fetch'); };
  assert.equal((await translateCommunity(['Das ist ein deutscher Beitrag über das Spiel und seine Steuerung auf dem Smartphone.'], 'de', forbidden)).translated, false);
  assert.deepEqual((await translateCommunity(['',''], 'de', forbidden)).fields, ['','']);
});
test('identical in-flight translation is deduplicated, cached and leaves originals intact', async () => {
  let calls = 0;
  const original = ['A special translation request for the deduplication check.'];
  const fetcher = async url => { calls++; assert.equal(url.searchParams.get('langpair'), 'autodetect|de'); await new Promise(resolve => setTimeout(resolve, 10)); return response('Ein übersetzter Testbeitrag.'); };
  const results = await Promise.all(Array.from({length:8}, () => translateCommunity(original, 'de', fetcher)));
  assert.equal(calls, 1);
  assert.ok(results.every(result => result.translated && result.fields[0] === 'Ein übersetzter Testbeitrag.'));
  await translateCommunity(original, 'de', fetcher);
  assert.equal(calls, 1);
  assert.equal(original[0], 'A special translation request for the deduplication check.');
});
test('parallel translations never exceed three provider requests and keep fields ordered', async () => {
  let active = 0, maximum = 0;
  const fetcher = async url => { active++; maximum = Math.max(maximum, active); await new Promise(resolve => setTimeout(resolve, 5)); active--; return response('translated:' + url.searchParams.get('q')); };
  const fields = ['Concurrency test sentence. '.repeat(100), 'Second title field.'];
  const result = await translateCommunity(fields, 'vi', fetcher);
  assert.equal(maximum, 3);
  assert.equal(active, 0);
  assert.equal(result.fields.length, 2);
  assert.ok(result.fields[1].endsWith('Second title field.'));
});
test('provider failures, quotas and invalid response text fail safely without caching bad results', async () => {
  const failures = [ {ok:false}, {ok:true,json:async()=>({responseStatus:403,responseData:{translatedText:'quota error'}})}, {ok:true,json:async()=>({responseStatus:200,quotaFinished:true,responseData:{translatedText:'quota error'}})}, {ok:true,json:async()=>({responseStatus:200,responseData:{translatedText:''}})} ];
  for (let index = 0; index < failures.length; index++) {
    const fields = [`This is a separate provider failure test number ${index}.`];
    await assert.rejects(translateCommunity(fields, 'fr', async()=>failures[index]));
    const recovered = await translateCommunity(fields, 'fr', async()=>response('Un texte traduit.'));
    assert.equal(recovered.fields[0], 'Un texte traduit.');
  }
});
