export const pointsPerDock = 400;

const dockGuide = `<div class="mission-line dock-guide" id="missionLine" role="group" aria-label="Andockhilfe">
  <span>Position<b id="dockPosition"></b></span>
  <span>Tempo<b id="dockSpeed"></b></span>
  <span>Winkel<b id="dockAngle"></b></span>
  <span>Halten<b id="dockHold"></b></span>
</div>`;

const dockGuideStyle = `<style>
  #gameScreen #missionLine.dock-guide {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    height: 38px;
    min-height: 38px;
    max-height: none;
    padding: 0;
  }
  .dock-guide span {
    display: grid;
    align-content: center;
    border: 1px solid #79604a;
    background: #151b30;
    color: #c0cbe0;
    font: 10px/1.3 system-ui, sans-serif;
  }
  .dock-guide b { color: #ffd497; font-size: 11px; white-space: nowrap; }
  .dock-guide [data-ready] { border-color: #5a9e91; }
  .dock-guide [data-ready] b { color: #a5f6d6; }
</style>`;

const dockChecks = `
function assessDock(s) {
  const t = s.target;
  const dx = s.x - t.x, dy = s.y - t.y;
  const sin = Math.sin(t.angle), cos = Math.cos(t.angle);
  const localX = dx * cos + dy * sin, localY = -dx * sin + dy * cos;
  const clearance = 24 - 7 * s.challenge;
  s.relativeSpeed = Math.hypot(s.vx - t.vx, s.vy - t.vy);
  s.dockTurn = C.angleDiff(t.angle, s.angle);
  s.angleError = Math.abs(s.dockTurn);
  s.dockPositionOK = Math.abs(localX) < clearance && Math.abs(localY) < clearance;
  s.dockSpeedOK = s.relativeSpeed < 15 - 4 * s.challenge;
  s.dockAngleOK = s.angleError < .19 - .045 * s.challenge;
  return { localX, localY };
}
function guideCell(id, text, ready) {
  const cell = document.getElementById(id);
  if(cell.textContent !== text) cell.textContent = text;
  cell.parentElement.toggleAttribute('data-ready', ready);
}
function showDockGuide(s) {
  const releasing = !!s.releaseUntil;
  const movingTarget = Math.hypot(s.target.vx, s.target.vy) > 3;
  guideCell('dockPosition', releasing || s.dockPositionOK ? 'Passt' : 'Zur Bucht', releasing || s.dockPositionOK);
  guideCell('dockSpeed', releasing || s.dockSpeedOK ? 'Passt' : movingTarget ? 'Angleichen' : 'Bremsen', releasing || s.dockSpeedOK);
  guideCell('dockAngle', releasing || s.dockAngleOK ? 'Passt' : s.dockTurn < 0 ? '↶ Links' : '↷ Rechts', releasing || s.dockAngleOK);
  const hold = releasing ? 'Abflug' : s.dwell.toFixed(1).replace('.', ',') + ' / 1 s';
  guideCell('dockHold', hold, releasing || s.dwell > 0);
  if(s.v===4) {
    const note = document.getElementById('gameEquipment');
    const text = s.impulses ? 'TESTMODUS · ' + s.impulses + ' Steuerimpulse' : 'TESTMODUS · Steuerimpuls lädt';
    if(note.textContent !== text) note.textContent = text;
  }
}
`;

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
    .replace("</head>", `${dockGuideStyle}</head>`)
    .replace('<p class="mission-line" id="missionLine" role="status"></p>', dockGuide)
    .replace("$('missionLine').textContent=C.session.module.status(s);", "C.session.module.guide(s);")
    .replace(
      "function targetAt(s,time){if(s.v===2)",
      `${dockChecks}\nfunction targetAt(s,time){${survivalBay}if(s.v===2)`,
    )
    .replace(
      /if\(s\.v===5\)\{const points=\[\[120,188,.25\],\[355,285,-.4\],\[240,158,0\]\][^\n]+?(?=return \{x:240,y:175)/,
      "",
    )
    .replace(
      "docks:0,impulses:24",
      "docks:0,releaseUntil:0,bayOpenedAt:0,challenge:0,impulses:24,impulseRecharge:0",
    )
    .replace("C.modules.G03={", "C.modules.G03={guide:showDockGuide,")
    .replace("s.target=targetAt(s,0);return s;", "s.target=targetAt(s,0);assessDock(s);return s;")
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
     assessDock(s);
     return;
   }
   let a=C.inputVector(input);`,
    )
    .replace(
      "if(s.v===4){if(input.impulse&&s.impulses>0&&(a.x||a.y)){s.vx+=a.x*32;s.vy+=a.y*32;s.impulses--;}}",
      `if(s.v===4){
   if(s.impulses===0) {
     s.impulseRecharge += dt;
     if(s.impulseRecharge >= 2) {
       s.impulses = 1;
       s.impulseRecharge = 0;
     }
   }
   const direction = Math.hypot(a.x, a.y);
   if(input.impulse && s.impulses>0 && direction>0) {
     s.vx += a.x / direction * 32;
     s.vy += a.y / direction * 32;
     s.impulses--;
   }
 }`,
    )
    .replace(
      /s\.target=targetAt\(s,s\.elapsed\);const t=s\.target,dx=[^\n]+\n s\.relativeSpeed=[^\n]+\n const inside=[^\n]+\n if\(inside[^\n]+/,
      `s.target=targetAt(s,s.elapsed);
 const t=s.target, {localX,localY}=assessDock(s);
 if(s.dockPositionOK&&s.dockSpeedOK&&s.dockAngleOK)s.dwell+=dt;else s.dwell=0;`,
    )
    .replace(
      "s.hardContacts++;s.y+=35;s.vy=Math.abs(s.vy)*.2;s.vx*=.3;",
      `s.hardContacts++;
   const edge = localY > -68 ? -31 : -104;
   const separation = edge - localY;
   const away = Math.sign(separation) * 24;
   s.x = C.clamp(s.x - Math.sin(t.angle) * separation, 36, 444);
   s.y = C.clamp(s.y + Math.cos(t.angle) * separation, 50, 590);
   s.vx = t.vx - Math.sin(t.angle) * away;
   s.vy = t.vy + Math.cos(t.angle) * away;
   assessDock(s);`,
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
      /const distance=C\.distance\(s,t\),hint=[^;]+;/,
      `const hint = s.releaseUntil ? 'ABDOCKEN · NÄCHSTE BUCHT'
        : !s.dockPositionOK ? 'BUCHTMITTE ANFLIEGEN'
        : !s.dockSpeedOK ? 'RELATIVTEMPO ANGLEICHEN'
        : !s.dockAngleOK ? (s.dockTurn < 0 ? 'LINKS DREHEN' : 'RECHTS DREHEN')
        : 'POSITION HALTEN · FREIGABE LÄUFT';`,
    )
    .replace("g.arc(t.x,t.y,31,", "g.arc(t.x,t.y,31-6*s.challenge,");
}
