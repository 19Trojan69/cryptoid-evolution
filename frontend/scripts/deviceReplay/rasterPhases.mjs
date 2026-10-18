export const RASTER_PHASES=['original','canvas','original'].map((presentation,index)=>({
  name:`destruction-${presentation}-${index+1}`,
  label:['Originaldarstellung · Anfang','Canvas-Darstellung · vollständige Effekte','Originaldarstellung · Ende'][index],
  enemies:6,double:true,shield:true,durationMs:15000,settleMs:1500,fixture:'destruction',presentation,
}));
export const RASTER_CSS=`
.impact-effect.replay-canvas-proxy::before,.impact-effect.replay-canvas-proxy::after{content:none!important}
`;
export const BOUNDED_PHASES=['canvas','bounded','canvas'].map((presentation,index)=>({
  name:`surface-${presentation}-${index+1}`,
  label:['Canvas · Vergleich am Anfang','Canvas · begrenzte Zeichenfläche','Canvas · Rückvergleich'][index],
  enemies:6,double:true,shield:true,durationMs:15000,settleMs:1500,fixture:'destruction',presentation,
}));
// Refills occur only in the reference stress phases, never at block changes.
export const CAMPAIGN_PHASES=[
  {name:'bounded-before-blocks',label:'Explosionen vor den Blockwechseln',fixture:'destruction',durationMs:10000},
  {name:'bounded-block-transitions',label:'Mehrere automatische Blockwechsel',fixture:'transitions',durationMs:45000},
  {name:'bounded-after-blocks',label:'Explosionen nach den Blockwechseln',fixture:'destruction',durationMs:10000},
].map(phase=>({...phase,enemies:6,double:true,shield:true,settleMs:1500,presentation:'bounded'}));
export const BOSS_PHASES=[
  {name:'bounded-before-boss',label:'Explosionen vor dem Boss',fixture:'destruction',durationMs:8000},
  {name:'bounded-boss-cycle',label:'Boss, Pause und Rückkehr ins Spiel',fixture:'boss-cycle',durationMs:100000},
  {name:'bounded-after-boss',label:'Explosionen nach dem Boss',fixture:'destruction',durationMs:8000},
].map(phase=>({...phase,enemies:6,double:true,shield:true,settleMs:1500,presentation:'bounded'}));
