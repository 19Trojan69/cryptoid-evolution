import test from 'node:test';
import assert from 'node:assert/strict';
import { tintShipPixels } from './shipTint.ts';
import { paintShipMaterial } from './shipMaterial.ts';
import { playerColors } from './shipFleet.ts';
const luminance = (data, offset = 0) => .2126 * data[offset] + .7152 * data[offset + 1] + .0722 * data[offset + 2];

test('every metal preserves shadow, armor, highlight ordering and alpha', () => {
  const source = new Uint8ClampedArray([25,25,25,255, 85,85,85,255, 150,150,150,255, 235,235,235,255, 200,80,50,0]);
  for (const color of playerColors) {
    const result = source.slice(); tintShipPixels(result, color.rgb);
    const levels = [0,4,8,12].map(offset => luminance(result, offset));
    assert.ok(levels[0] < levels[1] && levels[1] < levels[2] && levels[2] < levels[3], color.id);
    assert.ok(levels[2] >= 120, `${color.id}: armor remains legible`);
    assert.ok(levels[3] - levels[2] > 45, `${color.id}: metallic reflection remains distinct`);
    assert.deepEqual([3,7,11,15,19].map(i=>result[i]), [255,255,255,255,0]);
    assert.deepEqual([...result.slice(16)], [...source.slice(16)]);
  }
});

test('blue glass stays blue, named red trim stays red on silver and gold', () => {
  for (const target of [[184,197,206], [205,167,87]]) {
    const pixels = new Uint8ClampedArray([10,30,100,255, 200,45,55,255]);
    tintShipPixels(pixels,target,[212,48,62]);
    assert.deepEqual([...pixels.slice(0,4)], [10,30,100,255]);
    assert.ok(pixels[4] > pixels[5]*1.8 && pixels[4] > pixels[6]*1.5);
  }
});

test('baked relief never expands alpha bounds, changes glass or creates opaque corners', () => {
  const pixels = new Uint8ClampedArray(5*5*4);
  for (let y=1;y<4;y++) for (let x=1;x<4;x++) pixels.set([100+x*25,100+x*25,100+x*25,255], (y*5+x)*4);
  pixels.set([10,30,100,255], (2*5+2)*4);
  const before=pixels.slice();paintShipMaterial(pixels,5,5,[101,113,123]);
  for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],before[i]);
  assert.deepEqual([...pixels.slice(48,52)], [10,30,100,255]);
  assert.ok(luminance(pixels, (1*5+3)*4)>luminance(pixels,(1*5+1)*4));
});
