import test from 'node:test';
import assert from 'node:assert/strict';
import {keepScreenAwake} from './screenWakeLock.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const surface=()=>{const doc=new EventTarget();doc.visibilityState='visible';let requests=0;const locks=[];
 return {doc,locks,get requests(){return requests;},nav:{wakeLock:{async request(type){assert.equal(type,'screen');requests++;const lock=new EventTarget();lock.released=false;lock.release=async()=>{lock.released=true;lock.dispatchEvent(new Event('release'));};locks.push(lock);return lock;}}}};};
test('active play acquires once, releases while hidden and reacquires when visible',async()=>{
 const s=surface(),stop=keepScreenAwake(s.nav,s.doc);await tick();assert.equal(s.requests,1);
 s.doc.dispatchEvent(new Event('pointerdown'));await tick();assert.equal(s.requests,1);
 s.doc.visibilityState='hidden';s.doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(s.locks[0].released,true);
 s.doc.visibilityState='visible';s.doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(s.requests,2);
 stop();await tick();assert.equal(s.locks[1].released,true);s.doc.dispatchEvent(new Event('pointerdown'));await tick();assert.equal(s.requests,2);
});
test('unsupported or denied wake locks do not interrupt the game',async()=>{
 const s=surface();keepScreenAwake({},s.doc)();
 const stop=keepScreenAwake({wakeLock:{request:async()=>{throw Error('denied');}}},s.doc);await tick();stop();
});
test('an in-flight lock is released when play ends before the promise resolves',async()=>{
 const s=surface();let resolve;const promise=new Promise(r=>resolve=r);
 const stop=keepScreenAwake({wakeLock:{request:()=>promise}},s.doc);stop();
 const lock=new EventTarget();lock.released=false;lock.release=async()=>{lock.released=true;};resolve(lock);await tick();assert.equal(lock.released,true);
});
