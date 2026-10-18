import {FIRE_KEYS,SMOKE_KEYS} from './rasterMath.mjs';

export const unionBounds=(a,b)=>!a?{...b}:({left:Math.min(a.left,b.left),top:Math.min(a.top,b.top),right:Math.max(a.right,b.right),bottom:Math.max(a.bottom,b.bottom)});
// Conservative bounds for the entire unchanged animation, including the
// prepared blur padding and every rotating polygon vertex at maximum scale.
export function impactBounds({effect,assets,pieces}) {
  let box={left:effect.x,top:effect.y,right:effect.x,bottom:effect.y};
  for(const [kind,keys] of [['fire',FIRE_KEYS],['smoke',SMOKE_KEYS]]){
    const texture=assets[kind];
    for(const [, ,x,y,sx,sy] of keys){
      box=unionBounds(box,{left:effect.x+x*texture.size-sx*texture.extent/2,
        right:effect.x+x*texture.size+sx*texture.extent/2,
        top:effect.y+y*texture.size-sy*texture.extent/2,
        bottom:effect.y+y*texture.size+sy*texture.extent/2});
    }
  }
  const size=effect.debrisSize??58;
  for(const piece of pieces){
    const [px,py]=piece.pivot.map(v=>v*size);
    const radius=Math.max(...piece.points.map(([x,y])=>Math.hypot(x*size-px,y*size-py)));
    const x=effect.x-size/2+px,y=effect.y-size/2+py;
    box=unionBounds(box,{left:x+Math.min(0,piece.x)-radius,right:x+Math.max(0,piece.x)+radius,
      top:y+Math.min(0,piece.y)-radius,bottom:y+Math.max(0,piece.y)+radius});
  }
  // Integer CSS coordinates retain the original device pixel grid at DPR 1/3.
  // Two extra CSS pixels cover raster edge antialiasing; no source is cropped.
  return {left:Math.floor(box.left)-2,top:Math.floor(box.top)-2,right:Math.ceil(box.right)+2,bottom:Math.ceil(box.bottom)+2};
}
export function fieldBounds(box,width,height) {
  if(!box)return {left:0,top:0,right:1,bottom:1};
  const left=Math.max(0,Math.min(width,box.left)),top=Math.max(0,Math.min(height,box.top));
  return {left,top,right:Math.max(left+1,Math.min(width,box.right)),bottom:Math.max(top+1,Math.min(height,box.bottom))};
}

// Compare direct readbacks on the original pixel grid. Copying one Canvas into
// another first adds an asymmetric alpha/color rounding pass to that side.
export function compareSurfacePixels(full,width,height,crop,cropWidth,cropHeight,originX,originY) {
  let differentPixels=0,maxChannelError=0,outsideNonzeroPixels=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const cx=x-originX,cy=y-originY,inside=cx>=0&&cy>=0&&cx<cropWidth&&cy<cropHeight;
    const a=(y*width+x)*4,b=(cy*cropWidth+cx)*4;
    let different=false;
    for(let c=0;c<4;c++){const error=Math.abs(full[a+c]-(inside?crop[b+c]:0));maxChannelError=Math.max(maxChannelError,error);different ||= error!==0;}
    if(different)differentPixels++;
    if(!inside&&full[a+3]!==0)outsideNonzeroPixels++;
  }
  return {differentPixels,maxChannelError,outsideNonzeroPixels};
}
