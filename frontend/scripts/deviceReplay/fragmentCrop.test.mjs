import test from 'node:test';
import assert from 'node:assert/strict';
import {fragmentCropStyle} from './fragmentCrop.mjs';

test('cropped fragment vertices follow the same world trajectory and hull coordinates',()=>{
  const points=shape=>[...shape.matchAll(/([-+\d.e]+)%\s+([-+\d.e]+)%/g)].map(m=>[+m[1],+m[2]]);
  const transform=(p,pivot,angle,scale,translation)=>{
    const x=(p[0]-pivot[0])*scale,y=(p[1]-pivot[1])*scale;
    return [pivot[0]+x*Math.cos(angle)-y*Math.sin(angle)+translation[0],pivot[1]+x*Math.sin(angle)+y*Math.cos(angle)+translation[1]];
  };
  for(const count of [4,8,16]){
    const cols=count===4?2:4,rows=count/cols;
    for(let i=0;i<count;i++){
      const x=i%cols,y=Math.floor(i/cols),w=100/cols,h=100/rows,l=x*w,t=y*h;
      const shape=`polygon(${l+2.1}% ${t}%, ${l+w-3.7}% ${t}%, ${l+w}% ${t+4.5}%, ${l+w}% ${t+h-1.8}%, ${l+w-6.2}% ${t+h}%, ${l+3.5}% ${t+h}%, ${l}% ${t+h-4.9}%, ${l}% ${t+2.4}%)`;
      const result=fragmentCropStyle(shape,cols,rows,x,y),original=points(shape),cropped=points(result['--fragment-crop-clip']);
      const oldPivot=[l+w/2,t+h/2],newPivot=[l+50/100*w,t+50/100*h];
      for(let j=0;j<original.length;j++){
        const reconstructed=[l+cropped[j][0]/100*w,t+cropped[j][1]/100*h];
        for(const angle of [-5,-1,0,.7,3.8])for(const scale of [.55,.8,1]){
          const a=transform(original[j],oldPivot,angle,scale,[45,-29]);
          const b=transform(reconstructed,newPivot,angle,scale,[45,-29]);
          assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-10);
        }
      }
      // The enlarged/offset child still spans exactly the original full hull.
      assert.equal(l-x*w,0);assert.equal(t-y*h,0);
      assert.equal(w*cols,100);assert.equal(h*rows,100);
    }
  }
});
