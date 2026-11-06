// Shared by CPU raster and both actual browser engines. No tolerance or saved
// screenshots: every output channel must match the unchanged renderer exactly.
export async function compareSurfaces({before,after,makeCanvas,loadImage,pixels,expectReduction=true}) {
 const result={complete:false,cases:0,differentChannels:0,rows:[],maxLiveSourceBytes:0};
 for(const config of before.bossManifest){
  const image=await loadImage(config.weaponImage);
  const owned=[[],[]];
  const factories=owned.map(list=>(w,h)=>{const c=makeCanvas(w,h);list.push(c);return c;});
  const destinations=[makeCanvas(1,1),makeCanvas(1,1)];
  try{
   const row={boss:config.id,sourceBeforeBytes:0,sourceAfterBytes:0,cases:0};
   for(const width of [390,844]){
    const w=Math.min(width*config.widthScale,width-24,825*.29*config.aspectRatio);
    const boss={config,width:w,height:w/config.aspectRatio*config.heightScale,weaponClock:3000,
     turrets:before.bossWeapons[config.id-1].map((g,i)=>({health:100,maxHealth:100,a:g.base,lastFired:2900,lock:170,firedBarrels:[0]}))};
    const size=before.weaponCanvasSize(boss);
    for(const c of destinations){c.width=Math.ceil(size.width);c.height=Math.ceil(size.height);}
    for(const phase of ['original','warm-repeat','heat','recoil','frozen','destroyed','rebuilt']){
     if(phase==='heat')boss.turrets.forEach(t=>t.health=40);
     if(phase==='recoil'){boss.weaponClock=2950;boss.turrets.forEach((t,i)=>t.a+=i%2?.37:-.29);}
     if(phase==='destroyed')boss.turrets.forEach(t=>t.health=0);
     if(phase==='rebuilt')for(let i=0;i<2;i++)(i?after:before).releaseBossWeaponSources(destinations[i]);
     const frozen=phase==='frozen',state=JSON.stringify(boss);
     for(let i=0;i<2;i++){
      const api=i?after:before,count=owned[i].length;
      if(!api.drawBossWeapons(destinations[i],boss,image,frozen,factories[i]))throw Error('Actual renderer failed');
      if(phase==='warm-repeat'&&owned[i].length!==count)throw Error('Warm draw must reuse source surface');
     }
     if(JSON.stringify(boss)!==state)throw Error('Renderer mutated combat state');
     const [a,b]=destinations.map(pixels);
     if(a.length!==b.length)throw Error('Output geometry changed');
     let differences=0,maxDelta=0;
     for(let i=0;i<a.length;i++)if(a[i]!==b[i]){differences++;maxDelta=Math.max(maxDelta,Math.abs(a[i]-b[i]));}
     if(differences){
      const samples=[];for(let i=0;i<a.length&&samples.length<8;i++)if(a[i]!==b[i]){const p=i-i%4;samples.push({x:(p/4)%destinations[0].width,y:Math.floor(p/4/destinations[0].width),before:Array.from(a.slice(p,p+4)),after:Array.from(b.slice(p,p+4))});}
      const src=owned.map(list=>list.find(c=>c.width>0&&c.height>0));
      const [sa,sb]=src.map(pixels);let sourceDifferences=0;
      for(let y=0;y<src[1].height;y++)for(let x=0;x<src[1].width;x++)for(let ch=0;ch<4;ch++)if(sa[(y*src[0].width+x)*4+ch]!==sb[(y*src[1].width+x)*4+ch])sourceDifferences++;
      throw Error(JSON.stringify({boss:config.id,width,phase,differences,maxDelta,samples,sourceDifferences,sourceSizes:src.map(c=>[c.width,c.height])}));
     }
     if(phase==='original'){
      const bytes=owned.map(list=>list.reduce((sum,c)=>sum+c.width*c.height*4,0));
      if(expectReduction?bytes[1]>=bytes[0]:bytes[1]!==bytes[0])throw Error('Unexpected source size for the verified browser path');
      if(width===390){row.sourceBeforeBytes=bytes[0];row.sourceAfterBytes=bytes[1];}
     }
     result.cases++;row.cases++;
    }
   }
   for(let i=0;i<2;i++)(i?after:before).disposeBossWeapons(destinations[i]);
   if([...owned.flat(),...destinations].some(c=>c.width!==0||c.height!==0))throw Error('Retired source or output surface retained');
   result.rows.push(row);
  }finally{
   for(let i=0;i<2;i++)(i?after:before).disposeBossWeapons(destinations[i]);
   for(const c of owned.flat())c.width=c.height=0;
   if(typeof image.close==='function')image.close();
   else if('src' in image)image.src='';
  }
 }
 result.complete=true;return result;
}
