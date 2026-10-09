import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardFilename, cardCanvasDimensions, canShareCard } from './cardDownload.ts';
test('mobile memory bound preserves full logical card including very long translations',()=>{
 for(const height of [2000,5000,15000,35000]){const d=cardCanvasDimensions(height);assert.ok(d.width*d.height<4_020_000);assert.ok(d.height<=8192);assert.ok(d.height/d.scale>=height);assert.ok(d.width/d.scale>=1200);}
});
test('filename contains readable hull and edition without path separators',()=>{assert.equal(cardFilename('Grey Scout','P-02/1'),'Cryptoid-Evolution_Grey-Scout_P-02-1.png');assert.equal(canShareCard(new Blob(),'card.png'),false);});
