import { effectsGain, readEffectsVolume } from './musicPreferences.ts';
import { ownerAudioDisabled, noteAudioEvent, captureAudioAuditEvents, noteAudioVoiceStart, noteAudioVoiceEnd, noteAudioVoiceRelease, audioClockMs } from './ownerAudioAudit.ts';
let context:AudioContext|null=null;
/** Prime synchronously from Play / purchase gestures for iOS audio policies. */
export function primeCardSound(){
 if(ownerAudioDisabled()){noteAudioEvent('card-blocked');return;}
 if(typeof AudioContext==='undefined')return;
 const auditEvent=captureAudioAuditEvents();
 try{context??=new AudioContext();auditEvent('card-resume-request');void context.resume().then(()=>auditEvent('card-resume-ok')).catch(()=>auditEvent('card-resume-failed'));}catch{auditEvent('card-resume-failed');/* Sound is optional; the card must still open. */}
}
export function cardAudioAuditSnapshot(){return {cardState:context?.state??'none',cardClockMs:audioClockMs(context)};}
export function closeCardAudioForAudit(){const retired=context;context=null;if(!retired)return;const auditEvent=captureAudioAuditEvents();auditEvent('card-close-request');
 try{void retired.close().then(()=>auditEvent('card-close-ok')).catch(()=>auditEvent('card-close-failed'));}catch{auditEvent('card-close-failed');}}
export function playCardSound():boolean{
 if(ownerAudioDisabled()){noteAudioEvent('card-blocked');return true;}
 if(readEffectsVolume()===0)return true;
 if(!context||context.state!=='running')return false;
 const ctx=context,at=ctx.currentTime,bus=ctx.createGain();bus.gain.value=effectsGain(readEffectsVolume())*.45;bus.connect(ctx.destination);
 const notes=[261.63,392,523.25,659.25,783.99];
 notes.forEach((frequency,index)=>{const oscillator=ctx.createOscillator(),envelope=ctx.createGain(),start=at+index*.095;
  oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency*.5,start);oscillator.frequency.exponentialRampToValueAtTime(frequency,start+.09);
  envelope.gain.setValueAtTime(.0001,start);envelope.gain.exponentialRampToValueAtTime(.16,start+.02);envelope.gain.exponentialRampToValueAtTime(.0001,start+1.05);
  oscillator.connect(envelope).connect(bus);oscillator.start(start);oscillator.stop(start+1.1);noteAudioVoiceStart(oscillator,ctx,start+1.1,'card');oscillator.onended=()=>{noteAudioVoiceEnd(oscillator);noteAudioVoiceRelease(oscillator);oscillator.disconnect();envelope.disconnect();if(index===notes.length-1)bus.disconnect();};
 });return true;
}
