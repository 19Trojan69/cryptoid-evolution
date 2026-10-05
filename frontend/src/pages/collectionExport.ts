import type { CollectionCard } from './collectionData';
import { createSectorBoss } from './sectorBoss';
import { preloadBossWeapons } from './BossWeaponsView';
import { drawBossWeapons, weaponCanvasSize } from './bossWeaponRenderer';

const loadImage=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Image unavailable'));img.src=src;});
async function artwork(card:CollectionCard):Promise<HTMLCanvasElement|HTMLImageElement>{
 const hull=await loadImage(card.image);
 if(!card.bossId)return hull;
 const boss=createSectorBoss(card.bossId*10,768,0,1200),size=weaponCanvasSize(boss);
 const guns=document.createElement('canvas');guns.width=Math.ceil(size.width);guns.height=Math.ceil(size.height);
 drawBossWeapons(guns,boss,await preloadBossWeapons(boss.config),true);
 const canvas=document.createElement('canvas');canvas.width=guns.width;canvas.height=guns.height;
 const ctx=canvas.getContext('2d')!;ctx.drawImage(hull,size.padX,size.padY,boss.width,boss.height);ctx.drawImage(guns,0,0);return canvas;
}
export async function exportCollectionCard(card:CollectionCard,de:boolean):Promise<Blob>{
 await document.fonts.ready;
 const [art,space]=await Promise.all([artwork(card),loadImage(card.background)]),canvas=document.createElement('canvas');canvas.width=1200;
 const ctx=canvas.getContext('2d')!;
 const wrap=(text:string,width:number,size=30)=>{ctx.font=`${size}px sans-serif`;const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;};
 const sections=[{heading:de?'SCHIFFSGESCHICHTE':'SHIP HISTORY',paragraphs:card.story},{heading:de?'AKTUELLE AUSRÜSTUNG':'CURRENT EQUIPMENT',paragraphs:card.equipment}];
 const blocks=sections.map(s=>({...s,lines:s.paragraphs.map(p=>wrap(p,1000))}));
 const title=wrap(card.name,1000,66),subtitle=wrap(card.subtitle,1000,30);
 const introHeight=title.length*78+subtitle.length*42;
 canvas.height=1010+introHeight+blocks.reduce((sum,b)=>sum+90+b.lines.reduce((s,l)=>s+l.length*44+26,0),0);
 const colors=['#a9b9ca','#62e5ea','#d9acff','#f5bd62','#ff719c'];const accent=colors[Math.min(4,card.tier-1)];
 const bg=ctx.createLinearGradient(0,0,1200,canvas.height);bg.addColorStop(0,'#192c43');bg.addColorStop(.4,'#081420');bg.addColorStop(1,'#131427');ctx.fillStyle=bg;ctx.fillRect(0,0,1200,canvas.height);
 const spaceHeight=1200*space.height/space.width;ctx.drawImage(space,0,0,1200,spaceHeight);
 const shade=ctx.createLinearGradient(0,0,0,spaceHeight);shade.addColorStop(0,'rgba(4,10,20,.12)');shade.addColorStop(.35,'rgba(4,10,20,.3)');shade.addColorStop(.75,'rgba(4,10,20,.92)');shade.addColorStop(1,'#111525');ctx.fillStyle=shade;ctx.fillRect(0,0,1200,spaceHeight);
 if(canvas.height>spaceHeight){ctx.fillStyle='#111525';ctx.fillRect(0,spaceHeight,1200,canvas.height-spaceHeight);}

 ctx.strokeStyle=accent;ctx.lineWidth=6;ctx.strokeRect(25,25,1150,canvas.height-50);ctx.globalAlpha=.35;ctx.lineWidth=1;ctx.strokeRect(40,40,1120,canvas.height-80);ctx.globalAlpha=1;
 for(let i=0;i<90;i++){ctx.fillStyle=i%3? '#d9e9f0':'#78beca';ctx.globalAlpha=.15+(i%4)*.09;ctx.beginPath();ctx.arc(60+(i*131)%1080,65+(i*197)%760,1+i%2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 let y=100;ctx.fillStyle=accent;ctx.font='bold 25px sans-serif';ctx.fillText('CRYPTOID EVOLUTION · '+card.serial,100,y);y+=60;
 ctx.font='bold 66px sans-serif';ctx.fillStyle='#f2f4fa';for(const line of title){ctx.fillText(line,100,y);y+=78;}ctx.font='30px sans-serif';ctx.fillStyle=accent;for(const line of subtitle){ctx.fillText(line,100,y);y+=42;}
 ctx.font='bold 23px sans-serif';ctx.fillText(card.category.toUpperCase()+'  '+ '✦'.repeat(card.tier),100,y+22);y+=60;
 const scale=Math.min(1000/art.width,440/art.height);ctx.drawImage(art,600-art.width*scale/2,y+(440-art.height*scale)/2,art.width*scale,art.height*scale);y+=475;
 ctx.strokeStyle=accent;ctx.beginPath();ctx.moveTo(100,y);ctx.lineTo(1100,y);ctx.stroke();y+=46;
 ctx.font='28px sans-serif';ctx.fillStyle='#e1e7ef';for(const [label,value]of card.stats){ctx.fillText(`${label}: ${value}`,100,y);y+=42;}y+=32;
 for(const block of blocks){ctx.fillStyle=accent;ctx.font='bold 28px sans-serif';ctx.fillText(block.heading,100,y);y+=54;ctx.fillStyle='#e0e7ef';ctx.font='30px sans-serif';for(const lines of block.lines){for(const line of lines){ctx.fillText(line,100,y);y+=44;}y+=26;}y+=30;}
 ctx.fillStyle=accent;ctx.font='22px sans-serif';ctx.fillText(de?'SAMMELKARTE · Fiktive Geschichte / Spielwerte · Edition 01':'COLLECTOR CARD · Fictional lore / game stats · Edition 01',100,canvas.height-90);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG export failed')),'image/png'));
}
