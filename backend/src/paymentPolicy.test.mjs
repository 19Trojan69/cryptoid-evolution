import { test } from "node:test";
import assert from "node:assert/strict";
import { hangarCatalog } from "./hangarCatalog.ts";
import { isTestnetWeaponPurchaseEnabled, testPiPurchaseAllowed } from "./paymentPolicy.ts";

test("only Twin and Rapid Twin can be purchased on Pi Testnet", () => {
  for (const offer of hangarCatalog) {
    const allowed = offer.id === "weapon_twin" || offer.id === "weapon_rapid_twin";
    assert.equal(isTestnetWeaponPurchaseEnabled(offer), allowed, offer.id);
    assert.equal(testPiPurchaseAllowed(offer, "Pi Testnet"), allowed, offer.id);
    assert.equal(testPiPurchaseAllowed(offer, "Pi Network"), false, offer.id);
  }
  assert.equal(testPiPurchaseAllowed(undefined, "Pi Testnet"), false);
  assert.equal(testPiPurchaseAllowed(hangarCatalog[0], undefined), false);
});
