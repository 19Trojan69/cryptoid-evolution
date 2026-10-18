// Private layer isolation. These omissions are not a proposed game setting.
export const LAYER_PHASES=[
  ['original-before','Vollständige Explosion · Anfang',true,true],
  ['fire-smoke-only','Nur Feuer und Rauch',true,false],
  ['debris-only','Nur Trümmer',false,true],
  ['empty-wrapper','Vergleich ohne beide Bildebenen',false,false],
  ['original-after','Vollständige Explosion · Ende',true,true],
].map(([name,label,fireSmoke,debris])=>({name,label,fireSmoke,debris,
  enemies:6,double:true,shield:true,durationMs:9000,settleMs:1500,fixture:'destruction'}));

export const LAYER_CSS=`
html[data-replay-fire-smoke="off"] .impact-effect.explosion::before,
html[data-replay-fire-smoke="off"] .impact-effect.explosion::after,
html[data-replay-fire-smoke="off"] .impact-effect.shatter::before,
html[data-replay-fire-smoke="off"] .impact-effect.shatter::after{content:none!important}
`;

export function createEffectLayersProbe({document,now=()=>performance.now(),
  getStyle=(element,pseudo)=>getComputedStyle(element,pseudo)}={}) {
  let fireSmoke=true,debris=true,samples=[],last=now(),maxSampleMs=0;
  return {
    start(mode){fireSmoke=mode.fireSmoke!==false;debris=mode.debris!==false;
      document.documentElement.setAttribute('data-replay-fire-smoke',fireSmoke?'on':'off');
      samples=[];last=now();maxSampleMs=0;},
    allowDebris:()=>debris,
    sample(){const time=now();if(time-last<2000||samples.length>=3)return;last=time;
      const roots=[...document.querySelectorAll('.impact-effect.explosion,.impact-effect.shatter')];
      const first=roots[0];
      samples.push({atMs:Math.round(time),domExplosions:roots.length,
        domFragments:roots.reduce((sum,root)=>sum+root.querySelectorAll('.scattered-debris-piece').length,0),
        fireContent:first?getStyle(first,'::before').content:null,
        smokeContent:first?getStyle(first,'::after').content:null});
      maxSampleMs=Math.max(maxSampleMs,now()-time);},
    read:()=>({fireSmoke,debris,samples,maxSampleMs:Math.round(maxSampleMs*100)/100,
      coverage:'Normal explosion/shatter roots remain. Designated phases omit their fire/smoke pseudo-elements or fragment subtree. All simulation effects, hull illumination, original audio, other graphics, haptics and timing continue. DOM/CSS samples do not prove pixel presentation.'}),
    stop(){fireSmoke=debris=true;document.documentElement.removeAttribute('data-replay-fire-smoke');},
  };
}
