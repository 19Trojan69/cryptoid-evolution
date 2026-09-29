import { test } from "node:test";
import assert from "node:assert/strict";
import { hangarCatalog } from "./hangarCatalog.ts";
import { testPiPurchaseAllowed } from "./paymentPolicy.ts";

test("only weapon shots on Pi Testnet can enter approval and completion", () => {
  for (const offer of hangarCatalog) {
    assert.equal(testPiPurchaseAllowed(offer, "Pi Testnet"), offer.kind === "weapon", offer.id);
    assert.equal(testPiPurchaseAllowed(offer, "Pi Network"), false, offer.id);
  }
  assert.equal(testPiPurchaseAllowed(undefined, "Pi Testnet"), false);
  assert.equal(testPiPurchaseAllowed(hangarCatalog[0], undefined), false);
});
