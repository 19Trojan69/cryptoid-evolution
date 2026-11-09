import { withArcadeManeuvers } from "./galaxyArcadeManeuvers";

export function withArcadeGameplayReview(html: string, game: number) {
  switch (game) {
    case 1:
      return html.replace("if(o.kind==='shard'&&C.distance(s,o)<o.r+23)", "if(!s.done&&o.kind==='shard'&&C.distance(s,o)<o.r+23)");
    case 2:
      return withArcadeManeuvers(html);
    case 4:
      return html
        .replace(
          "s.success=s.passed>=8;s.message=s.success?'Ringroute abgeschlossen.':'Mindestens acht Ringpassagen sind nötig.';",
          "s.success=s.resolved===12;s.message=s.success?'Ringroute abgeschlossen.':'Die Ringroute wurde nicht beendet.';",
        )
        .replace("Ringe · Ziel mindestens 8", "Ringe passiert")
        .replace(
          "s.items.find(o=>!o.scored)&&open(s,s.items.find(o=>!o.scored))?'OFFEN':'GESCHLOSSEN'",
          "!s.items.some(o=>!o.scored)?'IM ANFLUG':open(s,s.items.find(o=>!o.scored))?'OFFEN':'GESCHLOSSEN'",
        );
    case 5:
      return html
        .replace("s.spawnClock<=0){spawn(s);", "s.spawnClock<=0&&s.time>0){spawn(s);")
        .replace("s.cooldown<=0&&s.ammo>0&&s.shotsList", "s.time>0&&s.cooldown<=0&&s.ammo>0&&s.shotsList")
        .replace(
          "s.targets.find(t=>!t.dead&&O.segment(x-t.oldX,y-t.oldY,b.x-t.x,b.y-t.y,0,0)<(s.v===5&&t.open?12:t.r)+3)",
          `s.targets.find(t=>{
            if(t.dead)return false;
            const startX=x-t.oldX,startY=y-t.oldY,endX=b.x-t.x,endY=b.y-t.y;
            const distance=O.segment(startX,startY,endX,endY,0,0);
            if(s.v!==5||!t.open)return distance<t.r+3;
            if(distance<=12)return true;
            // A shot can travel into the open core. Check a glancing hit once it passes the center.
            const passedCenter=endX*(endX-startX)+endY*(endY-startY)>=0;
            return distance<t.r+3&&passedCenter;
          })`,
        )
        .replace("O.segment(x,y,b.x,b.y,t.x,t.y)>12", "O.segment(x-t.oldX,y-t.oldY,b.x-t.x,b.y-t.y,0,0)>12")
        .replace(
          "if(!s.done&&(s.time<=0||s.v===4&&s.ammo===0&&s.shotsList.length===0))conclude(s);",
          "if(!s.done&&s.shotsList.length===0&&(s.time<=0||s.v===4&&s.ammo===0))conclude(s);",
        );
    case 6:
      // Even the last missile in a spread must reach the station before the clock ends.
      return html.replace("s.waveClock<=0&&s.time>7&&", "s.waveClock<=0&&s.time>7.55*85/(85+40*s.challenge)&&");
    case 7:
      return html.replace("for(const c of s.capsules){c.age+=dt;", "if(s.done)return;\n for(const c of s.capsules){c.age+=dt;");
    case 8:
      return html
        .replace("s.encounters===0?240:s.v===4?(s.encounters%2?390:90)+i*35:", "s.v===4?(s.encounters%2?390:90)+i*35:s.encounters===0?240:")
        .replace("s.warning=s.spawnClock<2&&s.spawnClock>0?", "s.warning=s.spawnClock<2&&s.spawnClock>0&&s.time>8+s.spawnClock&&s.enemies.length<5?");
    default:
      return html;
  }
}
