// Preview-only geometry experiment: preserve the polygon, image coordinate
// system, pivot and trajectory while bounding each fragment to its own cell.
export function fragmentCropStyle(shape,columns,rows,column,row) {
  const width=100/columns,height=100/rows,left=column*width,top=row*height;
  const points=[...shape.matchAll(/([-+\d.e]+)%\s+([-+\d.e]+)%/g)];
  if(points.length!==8)throw new Error('Expected the original eight-point fragment');
  const local=points.map(([,x,y])=>`${(+x-left)/width*100}% ${(+y-top)/height*100}%`);
  return {'--fragment-crop-clip':`polygon(${local.join(', ')})`,
    '--fragment-crop-left':`${left}%`,'--fragment-crop-top':`${top}%`,
    '--fragment-crop-width':`${width}%`,'--fragment-crop-height':`${height}%`,
    '--fragment-crop-columns':columns,'--fragment-crop-rows':rows,
    '--fragment-crop-column':column,'--fragment-crop-row':row};
}

export const FRAGMENT_PHASES=['original','crop','original'].map((presentation,index)=>({
  name:`destruction-${presentation}-${index+1}`,
  label:['Explosionen · Ausgangszustand','Explosionen · Begrenzte Trümmerflächen','Explosionen · Rückvergleich'][index],
  enemies:6,double:true,shield:true,durationMs:20000,fixture:'destruction',presentation,
}));

export const FRAGMENT_CROP_CSS=`
[data-replay-compositor="crop"] .impact-effect:is(.explosion,.shatter) .scattered-debris-piece {
  inset:auto;left:var(--fragment-crop-left);top:var(--fragment-crop-top);
  width:var(--fragment-crop-width);height:var(--fragment-crop-height);
  clip-path:var(--fragment-crop-clip)!important;transform-origin:50% 50%!important;
}
[data-replay-compositor="crop"] .impact-effect:is(.explosion,.shatter) .scattered-debris-piece > :is(b,.scattered-debris-sprite) {
  right:auto;bottom:auto;
  left:calc(-100% * var(--fragment-crop-column));top:calc(-100% * var(--fragment-crop-row));
  width:calc(100% * var(--fragment-crop-columns));height:calc(100% * var(--fragment-crop-rows));
}`;
