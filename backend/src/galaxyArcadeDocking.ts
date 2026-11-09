export const pointsPerDock = 400;

const survivalBay = `if(s.section > 1) {
   const right = s.section % 2 === 0;
   const freighter = s.v===3;
   const speed = freighter ? .46 + .17 * s.challenge : .31 + .24 * s.challenge;
   const phase = (time - s.bayOpenedAt) * speed;
   const center = freighter ? (right ? 286 : 194) : (right ? 315 : 165);
   const width = freighter ? 62 + 26 * s.challenge : 36 + 32 * s.challenge;
   const height = 13 + 15 * s.challenge;
   return {
     x: center + Math.sin(phase) * width,
     y: (right ? 245 : 185) + Math.sin(phase * .75) * height,
     angle: (right ? -.15 : .15) + Math.sin(phase) * (.34 + .22 * s.challenge),
     vx: Math.cos(phase) * width * speed,
     vy: Math.cos(phase * .75) * height * speed * .75,
   };
 }
 if(s.v===5) return { x: 120, y: 188, angle: .25, vx: 0, vy: 0 };
 `;

export function withDockingSurvival(html: string) {
  return html
    .replace(
      "function targetAt(s,time){if(s.v===2)",
      `function targetAt(s,time){${survivalBay}if(s.v===2)`,
    )
    .replace(
      /if\(s\.v===5\)\{const points=\[\[120,188,.25\],\[355,285,-.4\],\[240,158,0\]\][^\n]+?(?=return \{x:240,y:175)/,
      "",
    )
    .replace(
      "docks:0,impulses:24",
      "docks:0,releaseUntil:0,bayOpenedAt:0,challenge:0,impulses:24,impulseRecharge:0",
    )
    .replace(
      "C.tick(s,dt);let a=C.inputVector(input);",
      `C.tick(s,dt);
   if(s.releaseUntil) {
     // Move out through the open side of the bay before guiding the next approach.
     s.x = C.clamp(s.x + s.vx * dt, 36, 444);
     s.y = C.clamp(s.y + s.vy * dt, 50, 590);
     if(s.elapsed >= s.releaseUntil) {
       s.releaseUntil = 0;
       s.bayOpenedAt = s.elapsed;
       s.section++;
       s.challenge = C.levelProgress(s.section);
       s.vx = 0;
       s.vy = 0;
       s.impulses = 24;
       s.impulseRecharge = 0;
     }
     s.target = targetAt(s, s.elapsed);
     return;
   }
   let a=C.inputVector(input);`,
    )
    .replace(
      "if(s.v===4){if(input.impulse",
      `if(s.v===4){
   if(s.impulses===0) {
     s.impulseRecharge += dt;
     if(s.impulseRecharge >= 2) {
       s.impulses = 1;
       s.impulseRecharge = 0;
     }
   }
   if(input.impulse`,
    )
    .replace(
      "const inside=Math.abs(localX)<24&&Math.abs(localY)<24;",
      "const clearance=24-7*s.challenge,inside=Math.abs(localX)<clearance&&Math.abs(localY)<clearance;",
    )
    .replace("s.relativeSpeed<15&&s.angleError<.19", "s.relativeSpeed<15-4*s.challenge&&s.angleError<.19-.045*s.challenge")
    .replace(
      /if\(s\.dwell>=1\)\{s\.docks\+\+;[^\n]+/,
      `if(s.dwell>=1){
     s.docks++;
     C.tone(920,.16);
     s.dwell = 0;
     s.score += ${pointsPerDock};
     s.releaseUntil = s.elapsed + .8;
     s.vx = t.vx - Math.sin(t.angle) * 85;
     s.vy = t.vy + Math.cos(t.angle) * 85;
     C.notice('SICHER ANGEDOCKT', t.x, t.y - 60);
 }`,
    )
    .replace(
      "if(s.time<=0&&!s.done){s.done=true;s.success=false;s.message='Andockauftrag nicht rechtzeitig abgeschlossen.';}",
      "",
    )
    .replace(
      "hint=distance>110?'ANFLUG",
      "hint=s.releaseUntil?'ABDOCKEN · NÄCHSTE BUCHT':distance>110?'ANFLUG",
    )
    .replace("g.arc(t.x,t.y,31,", "g.arc(t.x,t.y,31-6*s.challenge,")
    .replace("s.relativeSpeed>=15?", "s.relativeSpeed>=15-4*s.challenge?")
    .replace("s.angleError>=.19?", "s.angleError>=.19-.045*s.challenge?")
    .replace(":'POSITION HALTEN · FREIGABE LÄUFT';", ":s.dwell>0?'POSITION HALTEN · FREIGABE LÄUFT':'BUCHTMITTE ANFLIEGEN';")
    .replace(
      "status(s){return `Relativ",
      "status(s){if(s.releaseUntil)return 'Andocken bestätigt · Automatisches Abdocken';return `Relativ",
    )
    .replace(
      ":s.v===5?' · Auftrag '+(s.docks+1)+'/3':''",
      ":''",
    )
    .replace("s.v===4?' · Impulse '+s.impulses:''", "s.v===4?(s.impulses?' · Impulse '+s.impulses:' · Impuls lädt'):''");
}
