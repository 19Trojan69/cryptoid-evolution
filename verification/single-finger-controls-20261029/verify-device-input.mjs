import assert from 'node:assert/strict';
import { verifyNeutralContacts } from '../contact-diagnostics-20261029/verifyNeutralContacts.mjs';

// Real Chromium touch events against the original, isolated Boss-2 game UI.
// This is not a physical Pi Browser or a reproduction of an OS White Screen.
export async function verifyDeviceInput(page,context){
  const checks=[],state=()=>page.evaluate(()=>window.__crossDeviceTest.inspect());
  const cdp=await context.newCDPSession(page),field=await page.locator('.game-field').boundingBox();
  const button=await page.locator('.mission-shop-access').boundingBox();assert.ok(field&&button);
  const from={id:1,x:field.x+field.width*.8,y:field.y+field.height*.75};
  const over={id:1,x:button.x+button.width/2,y:button.y+button.height/2};
  const send=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  const stillPlaying=async()=>{const s=await state();assert.equal(s.status,'playing');assert.equal(s.weaponMenuOpen,false);assert.equal(s.technicalPause,false);};
  const before=await state();await send('touchStart',[from]);
  for(let n=1;n<=12;n++)await send('touchMove',[{id:1,x:from.x+(over.x-from.x)*n/12,y:from.y+(over.y-from.y)*n/12}]);
  await stillPlaying();await send('touchEnd',[]);await stillPlaying();
  assert.notEqual((await state()).player.x,before.player.x);checks.push('native steering crosses the actual weapons button without opening it');
  await page.waitForTimeout(1100);
  await send('touchStart',[from]);await send('touchStart',[from,{...over,id:2}]);
  await send('touchEnd',[from]);await stillPlaying();
  await send('touchEnd',[]);await stillPlaying();checks.push('native second touch on weapons does not pause active steering');
  await page.waitForTimeout(1100);
  await page.touchscreen.tap(over.x,over.y);
  await page.waitForFunction(()=>window.__crossDeviceTest.inspect().weaponMenuOpen);
  assert.equal((await state()).status,'paused');assert.equal(await page.evaluate(()=>window.__bossLabPauseEvents.at(-1).pauseReason),'weapon-menu');
  checks.push('release then a fresh native tap opens the actual paused weapons drawer');
  await page.locator('.mission-return').tap();
  await page.waitForFunction(()=>window.__crossDeviceTest.inspect().status==='playing'&&!window.__crossDeviceTest.inspect().weaponMenuOpen,{},{timeout:10000});
  await stillPlaying();checks.push('explicit one-finger return completes the original countdown and resumes combat');
  const neutralContacts=await verifyNeutralContacts(page,context,{buttonSelector:'.mission-shop-access',
    assertPlaying:stillPlaying,
    snapshot:async()=>{const s=await state();return {frameAt:s.frameAt,audioBuffers:s.audio?.audioSampleBuffers,audioBufferBytes:s.audio?.audioBufferBytes,audioState:s.audio?.audioState};},
    returnFromDeliberateTap:async()=>{
      await page.waitForFunction(()=>window.__crossDeviceTest.inspect().weaponMenuOpen);
      assert.equal((await state()).status,'paused');
      assert.equal(await page.evaluate(()=>window.__bossLabPauseEvents.at(-1).pauseReason),'weapon-menu');
      await page.locator('.mission-return').tap();
      await page.waitForFunction(()=>window.__crossDeviceTest.inspect().status==='playing'&&!window.__crossDeviceTest.inspect().weaponMenuOpen,{},{timeout:10000});
    }});
  assert.ok(neutralContacts.repeatedSequence.after.frameAt>neutralContacts.repeatedSequence.before.frameAt,'frames continue across the repeated native contacts');
  return {complete:true,physicalDevice:false,nativeChromiumTouch:true,checks,neutralContacts};
}
