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
