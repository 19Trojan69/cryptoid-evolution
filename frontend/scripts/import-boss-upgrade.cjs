const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/\x40napi-rs/canvas');
const Scene=require('./boss-upgrade-renderer.cjs');
const review=process.argv[2];if(!review)throw new Error('Pass the authorized boss-review directory');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'public/ships/bosses/evolved');
const manifest=JSON.parse(fs.readFileSync(path.join(review,'manifest.json')));
const oldFile=fs.readFileSync(path.join(review,'baseline-game-bossManifest.ts'),'utf8');
const original=JSON.parse(oldFile.match(/bossManifest: readonly BossConfig\[\] = (\[.*\]);/)[1]);
const make=(w,h)=>createCanvas(w,h),configs=[],masks=[],weapons=[];
const output=(file,c)=>fs.writeFileSync(path.join(dest,file),c.encodeSync('webp',86));
(async()=>{
 for(const e of manifest){
  if(global.gc)global.gc();
  const [o,h,m]=await Promise.all([e.originalFile,e.hullFile,e.hullMaskFile].map(f=>loadImage(path.join(review,f))));
  const sc=new Scene(make(1000,690),e,o,h,make,m),tag=String(e.newId).padStart(2,'0');
  // Bake the approved palette and depth once, never recolour pixels in the game loop.
  const hull=make(1000,Math.round(1000*e.sourceHeight/e.sourceWidth));
  sc.shipX=0;sc.shipY=0;sc.shipW=1000;sc.shipH=hull.height;sc.drawHull(hull.getContext('2d'));output(`boss-${tag}-hull.webp`,hull);
  const c=make(128,48),ctx=c.getContext('2d');ctx.drawImage(m,0,0,128,48);const pixels=ctx.getImageData(0,0,128,48).data,bits=Buffer.alloc(768);
  for(let i=0;i<6144;i++)if(pixels[i*4+3]>=100)bits[i>>3]|=128>>(i&7);masks.push(bits.toString('base64'));
  // Rounded source sprites, contact shadows and fixed sockets share one texture per boss.
  const items=[];let ax=2,ay=2,row=0;
  function place(image){if(ax+image.width+2>2048){ax=2;ay+=row+2;row=0;}const r={x:ax,y:ay,width:image.width,height:image.height};items.push({image,r});ax+=image.width+2;row=Math.max(row,image.height);return r;}
  const guns=sc.guns.map(g=>{
   const r=g.halfWidth*1.03,edge=Math.ceil((r*1.1+10)*4),socket=make(edge,edge),q=socket.getContext('2d');q.translate(edge/2,edge/2);q.scale(2,2);
   sc.ellipse(q,2,6,r*1.1,r*.87,'rgba(0,5,12,.78)');const grad=q.createLinearGradient(-r,-r,r,r);grad.addColorStop(0,'#c6bf9a');grad.addColorStop(.25,'#716e60');grad.addColorStop(.6,'#243643');grad.addColorStop(1,'#101c27');sc.ellipse(q,0,1,r,r*.72,grad);sc.ellipse(q,0,-1,r*.81,r*.56,'#152738');
   const result={};for(const k of ['key','name','kind','caliber','radius','halfWidth','back','muzzle','base','turnSpeed','interval','barrels','rows','shotColor','recoil'])result[k]=g[k];result.rows=g.rows||1;
   return {...result,sourceX:g.anchorX??g.sourceX,sourceY:g.anchorY??g.sourceY,visualShotWidth:g.visualShotWidth,spritePivot:g.spritePivot,sprite:place(g.sprite),shadow:place(g.shadow),socket:place(socket)};
  });
  const atlas=make(2048,ay+row+2),ac=atlas.getContext('2d');for(const {image,r} of items)ac.drawImage(image,r.x,r.y);output(`boss-${tag}-guns.webp`,atlas);
  // A composed hull is used only for explosion debris; the falling hull keeps the live final angles.
  const wreck=make(hull.width,hull.height),wc=wreck.getContext('2d');wc.drawImage(hull,0,0);sc.S=1000/e.sourceWidth;
  sc.guns.forEach(g=>{g.x=(g.anchorX??g.sourceX)*sc.S;g.y=(g.anchorY??g.sourceY)*sc.S;g.baseRadius=g.halfWidth*sc.S*1.03;g.a=0;sc.turret(wc,g);});output(`boss-${tag}-wreck.webp`,wreck);
  const base={...original[e.oldId-1],id:e.newId,originalId:e.oldId,level:e.newId*10,image:`/ships/bosses/evolved/boss-${tag}-hull.webp`,weaponImage:`/ships/bosses/evolved/boss-${tag}-guns.webp`,wreckImage:`/ships/bosses/evolved/boss-${tag}-wreck.webp`,sourceWidth:e.sourceWidth,sourceHeight:e.sourceHeight,aspectRatio:e.sourceWidth/e.sourceHeight,widthScale:Math.max(.88,original[e.newId-1].widthScale),explosionScale:original[e.newId-1].explosionScale,weaponAnchors:guns.map(g=>[g.sourceX/e.sourceWidth,g.sourceY/e.sourceHeight])};
  // Find safe burn sites on the cleaned alpha mask while retaining each hull's visual placement.
  const occupied=(x,y)=>{const col=Math.max(0,Math.min(127,Math.floor(x/100*128))),row=Math.max(0,Math.min(47,Math.floor(y/100*48)));return !!(bits[(row*128+col)>>3]&(128>>((row*128+col)&7)));};
  base.fireSites=base.fireSites.map(([x,y])=>{if(occupied(x,y))return [x,y];let best=null,dist=Infinity;for(let yy=15;yy<90;yy+=2)for(let xx=10;xx<90;xx+=2)if(occupied(xx,yy)&&(xx-x)**2+(yy-y)**2<dist){dist=(xx-x)**2+(yy-y)**2;best=[xx,yy];}if(!best)throw new Error('Empty mask');return best;});configs.push(base);weapons.push(guns);
 }
 const type="// Approved boss preview import; original numbered assets are retained.\nimport type { BossProjectileKind } from './enemyFire.ts';\nexport type BossConfig = { id:number; originalId:number; level:number; image:string; weaponImage:string; wreckImage:string; sourceWidth:number; sourceHeight:number; aspectRatio:number; widthScale:number; heightScale:number; engineAnchors:readonly (readonly [number,number])[]; weaponAnchors:readonly (readonly [number,number])[]; fireSites:readonly (readonly [number,number])[]; projectilePool:readonly BossProjectileKind[]; explosionScale:number; explosionStages:number };\n";
 fs.writeFileSync(path.join(root,'src/pages/bossManifest.ts'),type+'export const bossManifest: readonly BossConfig[] = '+JSON.stringify(configs)+';\nexport const bossForLevel = (level:number) => level >= 10 && level <= 500 && level % 10 === 0 ? bossManifest[level/10-1] : undefined;\n');
 fs.writeFileSync(path.join(root,'src/pages/bossMasks.ts'),'// Cleaned hull alpha masks, indexed by new boss number.\nexport const bossMasks: readonly string[] = '+JSON.stringify(masks)+';\n');
 const defs="export type BossWeaponKind = 'laser'|'pulse'|'plasma'|'heavy'|'siege'|'rocket';\nexport type AtlasRect = {x:number;y:number;width:number;height:number};\nexport type BossGunConfig = {key:string;name:string;kind:BossWeaponKind;caliber:number;radius:number;halfWidth:number;back:number;muzzle:number;base:number;turnSpeed:number;interval:number;barrels:readonly number[];rows:number;shotColor:string;recoil:number;sourceX:number;sourceY:number;visualShotWidth:number;spritePivot:{x:number;y:number};sprite:AtlasRect;shadow:AtlasRect;socket:AtlasRect};\n";
 fs.writeFileSync(path.join(root,'src/pages/bossWeapons.ts'),'// Generated from the approved 392 mounted weapons.\n'+defs+'export const bossWeapons: readonly (readonly BossGunConfig[])[] = '+JSON.stringify(weapons)+';\n');
 console.log('Imported 50 bosses,',weapons.flat().length,'guns and 150 pre-rendered textures.');
})().catch(e=>{console.error(e);process.exitCode=1});
