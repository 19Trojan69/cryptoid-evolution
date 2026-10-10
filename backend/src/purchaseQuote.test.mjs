import { test } from 'node:test';
import assert from 'node:assert/strict';
import quotes from '../build/purchaseQuote.js';
import records from '../build/paymentRecords.js';
const now = Date.parse('2026-10-09T18:00:00Z');
const at = new Date(now).toISOString();
const data = { 'pi-network': { usd: .25, eur: .22, last_updated_at: (now - 20000)/1000 } };
test('timestamped USD and direct EUR are immutable snapshots of a contemporary purchase', () => {
  const quote = quotes.quoteFromResponse('Pi Network', at, data, now);
  assert.equal(quote.availability, 'available');
  const price = records.purchasePriceView({ payment_network: 'Pi Network', payment_amount_pi: 10, purchaseQuote: quote });
  assert.equal(price.usdAmount, 2.5); assert.equal(price.eurAmount, 2.2);
  assert.equal(price.eurMethod, 'provider_quote');
});
test('old purchases, future prices, stale quotes and missing data are unavailable', () => {
  for (const [purchase, response] of [[new Date(now - 86400000).toISOString(), data], [at, { 'pi-network': { ...data['pi-network'], last_updated_at: now/1000 + 1 } }], [at, { 'pi-network': { ...data['pi-network'], last_updated_at: now/1000 - 301 } }], [at, null]])
    assert.equal(quotes.quoteFromResponse('Pi Network', purchase, response, now).availability, 'unavailable');
});
test('Test-Pi never has a monetary value, even with a legacy valuation or mainnet quote', () => {
  const quote = quotes.quoteFromResponse('Pi Testnet', at, data, now);
  assert.equal(quote.availability, 'test_payment');
  const row = records.paymentRecord({ payment_network: 'Pi Testnet', valuation: { eurPerPi: 5, eurAmount: 50 }, purchaseQuote: { ...quote, availability: 'available', usdPerPi: 5, eurPerPi: 5 } });
  assert.equal(row[17], null); assert.equal(row[18], null);
  assert.match(row.join(' '), /Testzahlung/);
});
