import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from './gameAudio.ts';

test('an unavailable native AudioContext returns false, then retries without an unhandled rejection', async () => {
 const original=globalThis.AudioContext;let attempts=0;
 globalThis.AudioContext=class {
  state='running';destination={};
  constructor(){if(++attempts===1)throw new DOMException('fixture host failure','NotSupportedError');}
  createGain(){return {gain:{value:1},connect:out=>out,disconnect(){}};}
  async resume(){} async close(){}
 };
 const audio=new GameAudio();
 try {assert.equal(await audio.start(),false);assert.equal(await audio.start(),true);assert.equal(attempts,2);}
 finally {audio.close();globalThis.AudioContext=original;}
});

test('a partial native graph is closed and discarded before a clean retry', async () => {
 const original=globalThis.AudioContext;const contexts=[];let disconnects=0;
 globalThis.AudioContext=class {
  state='running';destination={};closed=0;
  constructor(){contexts.push(this);}
  createGain(){return {gain:{value:1},connect:()=>{if(contexts.length===1)throw new Error('fixture connect failure');return this.destination;},disconnect(){disconnects++;}};}
  async resume(){} async close(){this.closed++;this.state='closed';}
 };
 const audio=new GameAudio();
 try {assert.equal(await audio.start(),false);assert.equal(contexts[0].closed,1);assert.equal(disconnects,1);
  assert.equal(await audio.start(),true);assert.equal(contexts.length,2);assert.equal(contexts[1].closed,0);}
 finally {audio.close();globalThis.AudioContext=original;}
});
