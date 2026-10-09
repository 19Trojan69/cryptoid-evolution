import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentEvidenceLinks } from './paymentEvidenceLinks.ts';
const hash = 'a'.repeat(64);
test('mainnet and testnet transaction links stay separate', () => {
  for (const [network,chain] of [['Pi Testnet','testnet'],['Pi Network','mainnet']]) {
    const source = `https://api.${chain}.minepi.com/transactions/${hash}`;
    const result = paymentEvidenceLinks({network,txid:hash.toUpperCase(),receiptSource:source});
    assert.equal(result.explorer, `https://blockexplorer.minepi.com/${chain}/transactions/${hash}`);
    assert.equal(result.api, source);
  }
});
test('unknown network and invalid identifiers never invent explorer evidence', () => {
  assert.equal(paymentEvidenceLinks({network:'Ungeklärt',txid:hash,receiptSource:null}).explorer,null);
  assert.equal(paymentEvidenceLinks({network:'Pi Testnet',txid:'../other',receiptSource:null}).explorer,null);
});
test('stored raw evidence remains unchanged and navigation rejects wrong networks or hosts', () => {
  const source = `https://api.testnet.minepi.com/transactions/${hash}`;
  const payment={network:'Pi Testnet',txid:hash,receiptSource:source};
  assert.equal(paymentEvidenceLinks(payment).api,source);
  assert.equal(payment.receiptSource,source);
  assert.equal(paymentEvidenceLinks({...payment,network:'Pi Network'}).api,null);
  assert.equal(paymentEvidenceLinks({...payment,receiptSource:'javascript:alert(1)'}).api,null);
  assert.equal(paymentEvidenceLinks({...payment,receiptSource:`https://fake.example/transactions/${hash}`}).api,null);
});
