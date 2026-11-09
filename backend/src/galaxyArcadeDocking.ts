export const pointsPerDock = 400;

const survivalBay = `const index = s.docks - (s.releaseUntil ? 1 : 0);
 if(s.v===5 && index < 2) {
     return index === 0
       ? { x: 120, y: 188, angle: .25, vx: 0, vy: 0 }
       : { x: 355, y: 285, angle: -.4, vx: 0, vy: 0 };
 }
 if(index > 0) {
   const right = index % 2 === 1;
   const difficulty = Math.min(index - 1, 5);
   const speed = .27 + .035 * difficulty;
   const phase = (time - s.bayOpenedAt) * speed;
   const width = 32 + 4 * difficulty;
   const height = 12 + 2 * difficulty;
   return {
     x: (right ? 343 : 137) + Math.sin(phase) * width,
     y: (right ? 245 : 185) + Math.sin(phase * .75) * height,
     angle: s.v===5 && index===2 ? 0 : (right ? -.18 : .18) + Math.sin(phase) * (.20 + .035 * difficulty),
     vx: Math.cos(phase) * width * speed,
     vy: Math.cos(phase * .75) * height * speed * .75,
   };
 }`;

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
      "docks:0,releaseUntil:0,bayOpenedAt:0,impulses:24,impulseRecharge:0",
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
