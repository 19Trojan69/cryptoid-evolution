// Isolated device-test scaffolding. Computed CSS is evidence of style/layout,
// not proof that the WebView/GPU presented a pixel. Never used by the game.
export const EFFECT_PHASES = ['original', 'hint', 'original'].map((presentation,index)=>({
  name:`destruction-${presentation}-${index+1}`,
  label:['Explosionen · Ausgangszustand','Explosionen · Ebenenvergleich','Explosionen · Rückvergleich'][index],
  enemies:6,double:true,shield:true,durationMs:20000,fixture:'destruction',presentation,
}));

export const EFFECT_PRESENTATION_CSS = `
html[data-replay-compositor="hint"] .impact-effect:is(.explosion,.shatter)::before,
html[data-replay-compositor="hint"] .impact-effect:is(.explosion,.shatter)::after,
html[data-replay-compositor="hint"] .impact-effect:is(.explosion,.shatter) .scattered-debris-piece {
  will-change: transform, opacity;
}`;

export function createEffectPresentationProbe({document,now=()=>performance.now(),style=el=>getComputedStyle(el),pseudo=(el,name)=>getComputedStyle(el,name)}={}) {
  let mode='original',last=-Infinity,samples=[],maxSampleMs=0;
  const round=n=>Math.round(n*100)/100;
  const rect=el=>{const r=el.getBoundingClientRect();return {x:round(r.x),y:round(r.y),width:round(r.width),height:round(r.height)};};
  const layer=s=>({opacity:s.opacity,display:s.display,visibility:s.visibility,
    animationName:s.animationName,animationPlayState:s.animationPlayState,
    animationDuration:s.animationDuration,transform:s.transform,filter:s.filter,
    willChange:s.willChange,hasBackground:s.backgroundImage!=='none'});
  return {
    start(next='original') {
      if(!['original','hint','crop'].includes(next))throw new Error('Unknown effect presentation');
      mode=next;last=now();samples=[];maxSampleMs=0;
      document.documentElement.setAttribute('data-replay-compositor',mode);
    },
    sample() {
      const time=now();if(time-last<3000||samples.length>=6)return;
      last=time;const started=now();
      const effects=[...document.querySelectorAll('.impact-effect.explosion,.impact-effect.shatter')];
      const viewport={width:document.documentElement.clientWidth,height:document.documentElement.clientHeight};
      samples.push({atMs:round(time),domEffects:effects.length,
        paused:document.querySelector('.game-shell')?.getAttribute('data-effects-paused'),
        viewport,examples:effects.slice(-2).map(el=>{
          const box=rect(el),fragment=el.querySelector('.scattered-debris-piece');
          return {kind:el.className,rect:box,
            intersectsViewport:box.x<viewport.width&&box.y<viewport.height&&box.x+box.width>0&&box.y+box.height>0,
            root:layer(style(el)),fire:layer(pseudo(el,'::before')),smoke:layer(pseudo(el,'::after')),
            fragment:fragment?{...layer(style(fragment)),layoutWidth:style(fragment).width,
              layoutHeight:style(fragment).height,clipPath:style(fragment).clipPath,
              transformOrigin:style(fragment).transformOrigin}:null};
        })});
      maxSampleMs=Math.max(maxSampleMs,now()-started);
    },
    read:()=>({mode,samples,maxSampleMs:round(maxSampleMs),
      coverage:'Bounded DOM/layout/computed-CSS samples; does not measure actual pixel visibility, paint or GPU presentation'}),
    stop(){document.documentElement.removeAttribute('data-replay-compositor');},
  };
}
