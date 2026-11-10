import { withArcadeManeuvers } from "./galaxyArcadeManeuvers";

export function withArcadeGameplayReview(html: string, game: number) {
  switch (game) {
    case 1:
      return html.replace("if(o.kind==='shard'&&C.distance(s,o)<o.r+23)", "if(!s.done&&o.kind==='shard'&&C.distance(s,o)<o.r+23)");
    case 2:
      return withArcadeManeuvers(html);
    case 4:
      return html
        .replace("function open(s,o){return s.v!==3||((s.elapsed+o.phase)",
          "function open(s,o,time=s.elapsed){return s.v!==3||((time+o.phase)")
        .replace("C.tick(s,dt);C.move(s,input,dt,240,true);",
          "const startX=s.x;C.tick(s,dt);C.move(s,input,dt,240,true);")
        .replace(
          "if(braking)s.brake=Math.max(0,s.brake-dt);else s.brake=Math.min(6,s.brake+dt*.25);",
          `let approachSpeed = ringSpeed;
           if (s.v === 3) {
             const brakingSpeed = 55;
             if (braking) {
               s.brake = Math.max(0, s.brake - dt);
               approachSpeed = brakingSpeed;
             } else {
               if (!input.action) s.brake = Math.min(6, s.brake + dt * .25);
               const acceleration = (ringSpeed - brakingSpeed) / .3;
               approachSpeed = Math.min(ringSpeed, (s.approachSpeed ?? ringSpeed) + acceleration * dt);
             }
             s.approachSpeed = approachSpeed;
           }`,
        )
        .replace("o.y+=dt*(braking?55:ringSpeed);", "const previousY=o.y;o.y+=dt*approachSpeed;")
        .replace(
          "const dx=Math.abs(s.x-o.x);good=dx<o.r-28&&open(s,o);",
          `let dx = Math.abs(s.x - o.x);
           let opened = open(s, o);
           if (s.v === 3 && o.y > previousY) {
             // Judge the opening and the ship position when the ring crosses the flight line.
             const fraction = C.clamp((s.y - previousY) / (o.y - previousY), 0, 1);
             dx = Math.abs(startX + (s.x - startX) * fraction - o.x);
             opened = open(s, o, s.elapsed - (1 - fraction) * dt);
           }
           const hullClearance = 28;
           // The 14px rim stroke extends 7px past the ring radius.
           if (s.v === 3 && dx >= o.r + 7 + hullClearance) {
             s.missed++;
             s.combo = 0;
             continue;
           }
           good = dx < o.r - hullClearance && opened;`,
        )
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
