// Private cause-isolation only. Omissions are never a proposed game setting.
export const WORKLOAD_PHASES=[
  ['original-before','Bild und Klang · Ausgangszustand',true,true],
  ['without-explosion-audio','Explosionsbild an · Explosionsklang aus',true,false],
  ['without-explosion-image-or-audio','Explosionsbild und Explosionsklang aus',false,false],
  ['without-explosion-image','Explosionsbild aus · Explosionsklang an',false,true],
  ['original-after','Bild und Klang · Rückvergleich',true,true],
].map(([name,label,explosionImages,explosionAudio])=>({name,label,explosionImages,explosionAudio,
  enemies:6,double:true,shield:true,durationMs:10000,settleMs:1500,fixture:'destruction'}));

export function createEffectWorkload({document,now=()=>performance.now()}={}) {
  let images=true,audio=true,allowedAudioCalls=0,omittedAudioCalls=0,samples=[],last=now();
  return {
    start(mode){images=mode.explosionImages!==false;audio=mode.explosionAudio!==false;
      allowedAudioCalls=omittedAudioCalls=0;samples=[];last=now();},
    allowImage:kind=>images||!['explosion','shatter'].includes(kind),
    allowAudio(){if(audio)allowedAudioCalls++;else omittedAudioCalls++;return audio;},
    sample(){const time=now();if(time-last<2000||samples.length>=4)return;last=time;
      samples.push({atMs:Math.round(time),domExplosions:document.querySelectorAll('.impact-effect.explosion,.impact-effect.shatter').length});},
    read:()=>({explosionImages:images,explosionAudio:audio,allowedAudioCalls,omittedAudioCalls,samples,
      coverage:'Only normal explosion/shatter DOM is omitted in designated phases. Simulation effects, hull illumination, other graphics, music, shots and haptics continue. Audio calls count requests, not audible output.'}),
    stop(){images=audio=true;},
  };
}
