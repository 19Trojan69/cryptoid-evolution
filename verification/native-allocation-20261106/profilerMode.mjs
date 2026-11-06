import assert from 'node:assert/strict';
export function recordOnlyFlags(help,guiAvailable){
 if(help.includes('--record-only'))return ['--record-only'];
 assert.equal(guiAvailable,false,'Older heaptrack must run without an installed automatic GUI');
 return [];
}
