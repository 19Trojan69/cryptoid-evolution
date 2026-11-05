import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const originalRunnerBlob='2ee2a34941f3dd2f0131dd9d882853511c8f622e';
export const blob=x=>createHash('sha1').update('blob '+Buffer.byteLength(x)+'\0').update(x).digest('hex');
export function retentionRunner(source){assert.equal(blob(source),originalRunnerBlob);const a="kind==='memory'?180:60",b="kind==='memory'?600:60";
 assert.equal(source.split(a).length,2);const changed=source.replace(a,b);assert.equal(changed.replace(b,a),source);return changed;}
