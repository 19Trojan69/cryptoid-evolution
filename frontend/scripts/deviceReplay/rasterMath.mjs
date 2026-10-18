// Private preserving-renderer experiment. Geometry comes from the original
// JSX; the builder supplies the original CSS artwork, without a second design.
export function easing(x,x1=.0,y1=.0,x2=.58,y2=1) {
  if(x<=0)return 0;if(x>=1)return 1;
  const b=(t,a,c)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*c+t*t*t;
  let lo=0,hi=1;
  for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(b(mid,x1,x2)<x)lo=mid;else hi=mid;}
  return b((lo+hi)/2,y1,y2);
}
export const FIRE_KEYS=[[0,1,0,0,.48,.44],[.21,1,-.02,-.03,.96,.88],[.46,.86,.02,-.05,1.16,1.08],[.72,.38,-.01,-.08,1.27,1.18],[1,0,.01,-.12,1.32,1.24]];
export const SMOKE_KEYS=[[0,0,0,0,.42,.42],[.14,0,0,0,.42,.42],[.30,.28,.02,-.05,.85,.78],[.55,.58,-.03,-.12,1.14,1.03],[1,0,.03,-.25,1.5,1.3]];
export function layerFrame(keys,progress) {
  progress=Math.max(0,Math.min(1,progress));
  const index=Math.max(1,keys.findIndex(k=>k[0]>=progress));
  const a=keys[index-1],b=keys[index],t=easing((progress-a[0])/(b[0]-a[0]));
  return a.slice(1).map((value,i)=>value+(b[i+1]-value)*t);
}
export function fragmentFrame(ms,delay) {
  const t=Math.max(0,Math.min(1,(ms-delay)/2120));
  const curve=x=>easing(x,.1,.49,.23,1);
  const motion=curve(t);
  const alpha=t<.09?curve(t/.09):t<.72?1-.05*curve((t-.09)/.63):.95*(1-curve((t-.72)/.28));
  return {motion,alpha,scale:1-.45*motion};
}
export const polygonPoints=shape=>[...shape.matchAll(/([-+\d.e]+)%\s+([-+\d.e]+)%/g)].map(m=>[+m[1]/100,+m[2]/100]);

export function rgba(hex) {
  if(hex==='transparent')return [0,0,0,0];
  let h=hex.slice(1);if(h.length===3||h.length===4)h=[...h].map(x=>x+x).join('');
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).concat(h.length===8?parseInt(h.slice(6),16)/255:1);
}
// CSS interpolates premultiplied sRGBA, unlike SVG's straight-alpha stops.
// Dense stops preserve that interpolation instead of darkening translucent art.
export function gradientStops(colors) {
  const result=[];
  for(let i=0;i<colors.length-1;i++){
    const [start,ca]=colors[i],[end,cb]=colors[i+1],a=rgba(ca),b=rgba(cb);
    const steps=a[3]!==b[3]&&a.slice(0,3).some((v,j)=>v!==b[j])?32:1;
    for(let k=0;k<steps;k++){
      const t=k/steps,alpha=a[3]*(1-t)+b[3]*t;
      const rgb=a.slice(0,3).map((v,j)=>alpha?(v*a[3]*(1-t)+b[j]*b[3]*t)/alpha:(a[3]?v:b[j]));
      result.push([start+(end-start)*t,rgb,alpha]);
    }
  }
  const [offset,color]=colors.at(-1),c=rgba(color),prior=rgba(colors.at(-2)[1]);
  result.push([offset,c[3]?c.slice(0,3):prior.slice(0,3),c[3]]);return result;
}
export function parseGradients(background) {
  return [...background.matchAll(/radial-gradient\(ellipse(?:\s+([\d.]+)%\s+([\d.]+)%)?\s+at\s+([\d.]+)%\s+([\d.]+)%,\s*([^)]*)\)/g)].map(m=>{
    const cx=+m[3]/100,cy=+m[4]/100;
    const rx=m[1]?+m[1]/100:Math.max(cx,1-cx)*Math.SQRT2;
    const ry=m[2]?+m[2]/100:Math.max(cy,1-cy)*Math.SQRT2;
    const colors=m[5].split(',').flatMap(stop=>{const p=stop.trim().split(/\s+/);return p.slice(1).map(offset=>[parseFloat(offset)/100,p[0]]);});
    return {cx,cy,rx,ry,colors};
  });
}
export function roundedPath(size,radius) {
  const [horizontal,vertical]=radius.split('/').map(part=>part.trim().split(/\s+/).map(parseFloat));
  const f=Math.min(1,100/(horizontal[0]+horizontal[1]),100/(horizontal[2]+horizontal[3]),100/(vertical[0]+vertical[3]),100/(vertical[1]+vertical[2]));
  const h=horizontal.map(x=>x*f*size/100),v=vertical.map(x=>x*f*size/100);
  return `M ${h[0]} 0 H ${size-h[1]} A ${h[1]} ${v[1]} 0 0 1 ${size} ${v[1]} V ${size-v[2]} A ${h[2]} ${v[2]} 0 0 1 ${size-h[2]} ${size} H ${h[3]} A ${h[3]} ${v[3]} 0 0 1 0 ${size-v[3]} V ${v[0]} A ${h[0]} ${v[0]} 0 0 1 ${h[0]} 0 Z`;
}
export function layerSvg(art,diameter,dpr) {
  const inset=parseFloat(art.inset)/100,size=diameter*(1-inset*2),sigma=parseFloat(art.filter.slice(5));
  const pad=Math.ceil(sigma*4)+2,extent=size+2*pad,pixels=Math.ceil(extent*dpr*1.5);
  const gradients=parseGradients(art.background);
  if(!gradients.length)throw new Error('Original gradient artwork not understood');
  const defs=gradients.map((g,i)=>`<radialGradient id="g${i}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${g.cx*size} ${g.cy*size}) scale(${g.rx*size} ${g.ry*size})">${gradientStops(g.colors).map(([offset,rgb,alpha])=>`<stop offset="${offset}" stop-color="rgb(${rgb.map(x=>x.toFixed(4)).join(',')})" stop-opacity="${alpha}"/>`).join('')}</radialGradient>`).join('');
  const path=roundedPath(size,art['border-radius']);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="${-pad} ${-pad} ${extent} ${extent}" color-interpolation="sRGB"><defs>${defs}<clipPath id="edge"><path d="${path}"/></clipPath><filter id="blur" filterUnits="userSpaceOnUse" x="${-pad}" y="${-pad}" width="${extent}" height="${extent}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${sigma}"/></filter></defs><g filter="url(#blur)"><g clip-path="url(#edge)">${gradients.map((_,i)=>i).reverse().map(i=>`<rect width="${size}" height="${size}" fill="url(#g${i})"/>`).join('')}</g></g></svg>`;
  return {svg,pixels,size,pad,extent};
}
