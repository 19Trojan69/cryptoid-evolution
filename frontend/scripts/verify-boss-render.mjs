import { createRequire } from 'node:module';
import { mkdirSync,writeFileSync } from 'node:fs';
import { createSectorBoss,moveSectorBoss } from '../src/pages/sectorBoss.ts';
import { advanceBossTurrets } from '../src/pages/bossTurrets.ts';
import { drawBossWeapons,weaponCanvasSize } from '../src/pages/bossWeaponRenderer.ts';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const output=process.argv[2]||'/workspace/boss-review/game-integration';mkdirSync(output,{recursive:true});
const sheet=createCanvas(1500,1250),sc=sheet.getContext('2d');sc.fillStyle='#080e1a';sc.fillRect(0,0,1500,1250);
for(let id=1;id<=50;id++){
 let boss=createSectorBoss(id*10,1000,0,1400);
 for(let t=0;t<8000;t+=20){boss=moveSectorBoss(boss,20,1000,1400);advanceBossTurrets(boss,{x:id%2?.18:.82,y:.8},1000,1400,20,8,t);}
 const [hull,atlas]=await Promise.all([loadImage('frontend/public'+boss.config.image),loadImage('frontend/public'+boss.config.weaponImage)]);
 const size=weaponCanvasSize(boss),guns=createCanvas(Math.ceil(size.width),Math.ceil(size.height));drawBossWeapons(guns,boss,atlas,false,createCanvas);
 const image=createCanvas(1000,480),c=image.getContext('2d');c.fillStyle='#0c1626';c.fillRect(0,0,1000,480);
 c.drawImage(hull,500-boss.width/2,240-boss.height/2,boss.width,boss.height);c.drawImage(guns,500-boss.width/2-size.padX,240-boss.height/2-size.padY);
 writeFileSync(`${output}/boss-${String(id).padStart(2,'0')}.png`,image.toBuffer('image/png'));
 const x=(id-1)%5*300,y=Math.floor((id-1)/5)*125;sc.drawImage(image,x,y,300,115);sc.fillStyle='#dcecff';sc.font='12px sans-serif';sc.fillText(`Boss ${id} / Original ${boss.config.originalId}`,x+8,y+120);
}
writeFileSync(`${output}/all-50-integrated.png`,sheet.toBuffer('image/png'));console.log('Rendered all 50 using the integrated gun renderer.');
