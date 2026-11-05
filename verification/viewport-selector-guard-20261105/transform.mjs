import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const blob=x=>createHash('sha1').update('blob '+Buffer.byteLength(x)+'\0').update(x).digest('hex');
export const originalBlob='ed22e9a650b956d930f0febf71361a5ded9e4c46';
export function viewportStyle(source){assert.equal(blob(source),originalBlob,'Exact existing viewport stylesheet');let changed=source;
 for(const root of ['html','body']){const a=root+':has(.game-route)',b=a+':where(:not(.game-viewport-locked))';
  assert.equal(changed.split(a).length,2);changed=changed.replace(a,b);}
 let restored=changed;for(const root of ['html','body'])restored=restored.replace(root+':has(.game-route):where(:not(.game-viewport-locked))',root+':has(.game-route)');
 assert.equal(restored,source);return changed;}
