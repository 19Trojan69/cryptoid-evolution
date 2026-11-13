const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const { MongoClient } = require("mongodb");
const sharp = require("sharp");
const { shipNftCatalog, SHIP_NFT_ART_COLLECTION, SHIP_NFT_ART_REVISION } = require("../build/shipNftEligibility.js");

async function main() {
  const [bundle, command] = process.argv.slice(2);
  assert(bundle && (command === undefined || command === "--apply"), "Usage: node backend/scripts/importShipNftArtwork.cjs <extracted bundle> [--apply]");
  const manifest = JSON.parse(await readFile(join(bundle, "manifest.json"), "utf8"));
  assert.equal(manifest.revision, SHIP_NFT_ART_REVISION);
  assert.equal(manifest.cards.length, shipNftCatalog.length);
  const records = [];
  for (const card of shipNftCatalog) {
    const entry = manifest.cards.find(item => item.id === card.id);
    const preview = `preview/${card.edition.toLowerCase()}/${card.shipId}.webp`;
    assert.equal(entry?.preview, preview, card.id);
    assert.equal(entry.productId, card.productId, card.id);
    const bytes = await readFile(join(bundle, preview));
    assert(bytes.length <= 105_000, card.id);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.previewSha256, card.id);
    const image = await sharp(bytes).metadata();
    assert.deepEqual([image.format, image.width, image.height], ["webp", 540, 720], card.id);
    records.push({ _id: `${SHIP_NFT_ART_REVISION}:${card.id}`, webp: bytes.toString("base64") });
  }
  if (!command) {
    console.log(`Verified ${records.length} previews for ${SHIP_NFT_ART_REVISION}.`);
    return;
  }
  const { MONGODB_URI, MONGODB_DATABASE_NAME } = process.env;
  assert(MONGODB_URI && MONGODB_DATABASE_NAME, "Set the target database URI and name explicitly.");
  const client = new MongoClient(MONGODB_URI);
  try {
    const collection = client.db(MONGODB_DATABASE_NAME).collection(SHIP_NFT_ART_COLLECTION);
    await collection.bulkWrite(records.map(record => ({ replaceOne: {
      filter: { _id: record._id }, replacement: record, upsert: true,
    } })), { ordered: false });
    assert.equal(await collection.countDocuments({ _id: { $in: records.map(record => record._id) } }), records.length);
    console.log(`Imported ${records.length} previews for ${SHIP_NFT_ART_REVISION}.`);
  } finally {
    await client.close();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
