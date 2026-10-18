export const RASTER_PHASES=['original','canvas','original'].map((presentation,index)=>({
  name:`destruction-${presentation}-${index+1}`,
  label:['Originaldarstellung · Anfang','Canvas-Darstellung · vollständige Effekte','Originaldarstellung · Ende'][index],
  enemies:6,double:true,shield:true,durationMs:15000,settleMs:1500,fixture:'destruction',presentation,
}));
export const RASTER_CSS=`
.impact-effect.replay-canvas-proxy::before,.impact-effect.replay-canvas-proxy::after{content:none!important}
`;
