import type { BossWeaponKind } from './bossWeapons.ts';
export const bossSoundReferences:Record<BossWeaponKind,number>={laser:6,pulse:6,plasma:9.5,heavy:17.5,siege:28,rocket:5.04};
export const bossSoundDurations:Record<BossWeaponKind,number>={laser:.23,pulse:.34,plasma:.55,heavy:.48,siege:1.05,rocket:.73};
// Original cached PCM synthesis used by the approved browser sound preview.
export const generateBossSound=(kind:BossWeaponKind,variant=1,sampleRate=48000)=>{
  if(!(kind in bossSoundDurations))throw new Error('Unknown weapon');
  const size=[.8,1,1.25][variant],duration=bossSoundDurations[kind]*(.88+size*.12),data=new Float32Array(Math.ceil(duration*sampleRate));
  let seed=1307+Object.keys(bossSoundDurations).indexOf(kind)*8191+variant*31,phase=0,low=0,air=0;
  const noise=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/2147483648-1;};
  for(let i=0;i<data.length;i++){
   const t=i/sampleRate,n=noise();low+=.075*(n-low);air+=.34*(n-air);
   let frequency,envelope,body;
   if(kind==='laser'){
    frequency=(1750*Math.exp(-t*16)+380)/Math.sqrt(size);phase+=2*Math.PI*frequency/sampleRate;
    envelope=Math.exp(-t*22);body=.62*Math.sin(phase)+.18*Math.sin(phase*2.03)+.13*(n-air)*Math.exp(-t*50);
   }else if(kind==='pulse'){
    frequency=(470*Math.exp(-t*12)+125)/Math.sqrt(size);phase+=2*Math.PI*frequency/sampleRate;
    envelope=Math.exp(-t*14);body=.53*Math.sin(phase)+.23*Math.sin(phase*1.99)*(1+.3*Math.sin(t*430))+.14*air*Math.exp(-t*25);
   }else if(kind==='plasma'){
    frequency=(170*Math.exp(-t*8)+72)/Math.sqrt(size);phase+=2*Math.PI*frequency/sampleRate;
    envelope=Math.exp(-t*8);body=.56*Math.sin(phase)+.17*Math.sin(phase*2.4)+.62*air*(.65+.35*Math.sin(t*92))*Math.exp(-t*3);
   }else if(kind==='heavy'){
    frequency=(85*Math.exp(-t*14)+48)/Math.sqrt(size);phase+=2*Math.PI*frequency/sampleRate;
    envelope=Math.exp(-t*10);body=.60*Math.sin(phase)+.18*Math.sin(phase*3)+.13*Math.sin(phase*5)+.45*n*Math.exp(-t*80)+1.8*low*Math.exp(-t*5)+.1*Math.sin(t*2*Math.PI*940)*Math.exp(-t*55);
   }else if(kind==='siege'){
    frequency=(48*Math.exp(-t*10)+33)/Math.sqrt(size);phase+=2*Math.PI*frequency/sampleRate;
    envelope=Math.exp(-t*5.8);body=.52*Math.sin(phase)+.26*Math.sin(phase*2.02)+.18*Math.sin(phase*4.02)+.10*Math.sin(phase*6.01)+2.1*low*Math.exp(-t*1.5)+.36*n*Math.exp(-t*55);
   }else{
    frequency=(96+100*Math.min(1,t/.22))/Math.sqrt(size);phase+=2*Math.PI*frequency/sampleRate;
    envelope=Math.exp(-t*5.5)*(1-Math.exp(-t*95));body=1.8*air+.16*Math.sin(phase)+.3*(n-air)*Math.exp(-t*9);
   }
   const attack=1-Math.exp(-t*(kind==='rocket'?650:1800)),fade=Math.min(1,(duration-t)/.02);
   data[i]=body*envelope*attack*fade;
  }
  // Short designed reflection, baked once rather than calculated for every shot.
  const delay=Math.round(sampleRate*(kind==='siege'?.074:kind==='plasma'?.036:.022));
  for(let i=data.length-1;i>=delay;i--)data[i]+=data[i-delay]*(kind==='siege'?.16:.09);
  let peak=0;for(const v of data)peak=Math.max(peak,Math.abs(v));
  for(let i=0;i<data.length;i++)data[i]=data[i]/Math.max(peak,1e-9)*.72;
  return data;

};
