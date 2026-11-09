export const pointsPerVortexPass = 150;
export const pointsPerBoostDodge = 60;

const maneuverRules = `
const vortex = { x: 240, y: 326, radius: 140, inner: 95, outer: 195, gate: .34 };

function trackVortexPass(s, oldX, oldY, dt, rotation, touchedRock) {
  const x = s.x - vortex.x, y = s.y - vortex.y;
  const startX = oldX - vortex.x, startY = oldY - vortex.y;
  const before = Math.hypot(startX, startY), after = Math.hypot(x, y);
  const outward = after >= vortex.radius;
  if (touchedRock) {
    s.swirlStage = 'approach';
  } else if ((before >= vortex.radius) !== outward) {
    const fraction = (vortex.radius - before) / (after - before);
    const crossing = Math.atan2(startY + (y - startY) * fraction, startX + (x - startX) * fraction);
    const gate = s.gap - (1 - fraction) * dt * rotation;
    const throughGate = Math.abs(C.angleDiff(crossing, gate)) <= vortex.gate;
    if (throughGate && !outward && s.swirlStage === 'outside') s.swirlStage = 'entering';
    else if (throughGate && outward && s.swirlStage === 'inside') s.swirlStage = 'leaving';
    else s.swirlStage = 'approach';
  }
  if (s.swirlStage === 'entering' && after <= vortex.inner) s.swirlStage = 'inside';
  if (after >= vortex.outer) {
    if (s.swirlStage === 'leaving') {
      s.swirlPassages++;
      s.score += ${pointsPerVortexPass};
      C.notice('WIRBELPASSAGE +${pointsPerVortexPass}', s.x, s.y - 65);
      C.tone(980);
    }
    s.swirlStage = 'outside';
  }
}

function boostCanAvoidHit(s, x, y) {
  const lookAhead = .5;
  const vx = (C.clamp(s.x + x * 200 * lookAhead, 38, 442) - s.x) / lookAhead;
  const vy = (C.clamp(s.y + y * 200 * lookAhead, 48, 586) - s.y) / lookAhead;
  const threatens = (object, radius) => {
    const dx = object.x - s.x, dy = object.y - s.y;
    const dxRate = object.vx - vx, dyRate = object.vy - vy;
    const approach = -(dx * dxRate + dy * dyRate) / (dxRate * dxRate + dyRate * dyRate || 1);
    if (approach <= 0) return false;
    const time = Math.min(approach, lookAhead);
    return Math.hypot(dx + dxRate * time, dy + dyRate * time) < radius;
  };
  return s.items.some(rock => threatens(rock, rock.r * .86 + 22))
    || s.patrol?.bullets.some(bullet => threatens(bullet, bullet.r + 22));
}

function moveWithBoost(s, dt, input) {
  let {x, y} = C.inputVector(input);
  if (!x && !y && input.target) {
    x = input.target.x - s.x;
    y = input.target.y - s.y;
  }
  const length = Math.hypot(x, y);
  if (length > .05) {
    s.boostX = x / length;
    s.boostY = y / length;
  }
  if (input.actionEdge && s.boost > 0 && s.boostTime <= 0) {
    const canMove = C.clamp(s.x + s.boostX, 38, 442) !== s.x || C.clamp(s.y + s.boostY, 48, 586) !== s.y;
    if (canMove) {
      const scale = Math.max(1, length);
      s.boostEscape = s.inv <= 0 && boostCanAvoidHit(s, x / scale, y / scale);
      s.boost--;
      s.boostTime = .7;
      s.inv = Math.max(s.inv, .85);
      C.tone(450,.16);
    } else C.notice('VOM RAND WEG LENKEN', s.x, s.y + 65);
  }
  if (s.boostTime > 0) {
    C.move(s, { x: s.boostX, y: s.boostY }, dt, 410);
    s.boostTime = Math.max(0, s.boostTime - dt);
  } else C.move(s, input, dt, 200);
}
`;

const vortexUpdate = ` if(s.v===3){
  const rotation = .24 + .20 * s.challenge;
  const phase = s.elapsed * rotation;
  s.gap = -Math.PI/2 + phase;
  s.items = [];
  let touchedRock = false;
  for(let i=0;i<20;i++){
    const a = i/20*Math.PI*2 + phase;
    if(Math.abs(C.angleDiff(a,s.gap))<.62)continue;
    const rock = { kind:'rock', x:vortex.x+Math.cos(a)*vortex.radius, y:vortex.y+Math.sin(a)*vortex.radius, r:22, angle:a, texture:i%6 };
    s.items.push(rock);
    if(C.distance(s,rock)<rock.r*.86+22) touchedRock = true;
  }
  if(touchedRock && s.elapsed > 3) C.damage(s);
  trackVortexPass(s, oldX, oldY, dt, rotation, touchedRock);`;

export function withArcadeManeuvers(html: string) {
  return html
    .replace("C.modules.G02={", `${maneuverRules}\nC.modules.G02={`)
    .replace("boost:3,boostTime:0,gap:-Math.PI/2,swirlStage:0,swirlBonus:0,nextSwirl:0", "boost:3,boostTime:0,boostX:0,boostY:-1,boostEscape:false,boostDodges:0,gap:-Math.PI/2,swirlStage:'approach',swirlPassages:0,zoneViolation:false")
    .replace(
      /C\.tick\(s,dt\);if\(s\.v===4&&input\.actionEdge&&s\.boost>0\)\{[^\n]+/,
      `C.tick(s,dt);
 const oldX = s.x, oldY = s.y;
 if(s.v===4) moveWithBoost(s,dt,input);
 else C.move(s,input,dt,200);`,
    )
    .replace(/ if\(s\.v===3\)\{s\.gap=[^\n]+\n  const d=Math\.hypot\(s\.x-240,s\.y-326\);[^\n]+/, vortexUpdate)
    .replace("C.damage(s);s.x=C.clamp(s.x,s.zoneLeft,s.zoneRight);", "s.zoneViolation=true;C.damage(s);s.x=C.clamp(s.x,s.zoneLeft,s.zoneRight);")
    .replace("s.constrict++;s.zoneBonus=(s.zoneBonus||0)+60;", "s.constrict++;if(!s.zoneViolation)s.zoneBonus=(s.zoneBonus||0)+60;s.zoneViolation=false;")
    .replace("if(C.distance(s,o)<o.r*.86+22&&C.damage(s))return false;", "if(C.distance(s,o)<o.r*.86+22){s.boostEscape=false;if(C.damage(s))return false;}")
    .replace("if(hit){if(C.damage(s)){p.hitCount++;}", "if(hit){if(s.boostEscape)s.boostEscape=false;if(C.damage(s)){p.hitCount++;}")
    .replace(
      "s.score=Math.floor(s.elapsed*10)+(s.frontBonus||0)+s.swirlBonus+(s.zoneBonus||0);\n C.patrol.update(s,dt);",
      `C.patrol.update(s,dt);
 if(s.boostEscape && s.boostTime<=0 && !s.done) {
   s.boostEscape = false;
   s.boostDodges++;
   C.notice('SCHUB-AUSWEICHEN +${pointsPerBoostDodge}', s.x, s.y - 65);
 }
 if(s.v!==3)s.score=Math.floor(s.elapsed*10)+(s.frontBonus||0)+(s.zoneBonus||0)+s.boostDodges*${pointsPerBoostDodge};`,
    )
    .replace("s.success=s.v!==3||s.swirlBonus>=450;s.score+=", "s.success=s.v!==3||s.swirlPassages>=3;if(s.v!==3)s.score+=")
    .replace("(3-s.hits)*100+(s.v===4?s.boost*40:0)", "(3-s.hits)*100")
    .replace("s.swirlStage?'JETZT NACH AUSSEN':'INSEL ERREICHEN'", "s.swirlStage==='inside'||s.swirlStage==='leaving'?'DURCH DIE ÖFFNUNG RAUS':s.swirlStage==='entering'?'ZUR INSEL FLIEGEN':s.swirlStage==='outside'?'DURCH DIE ÖFFNUNG REIN':'AUSSEN NEU ANFLIEGEN'")
    .replace("Insel betreten, dann durch die Öffnung verlassen · Passagen ${s.swirlBonus/150}/3", "Durch die Öffnung rein und raus · Passagen ${s.swirlPassages}/3")
    .replace("${s.boost} Schubimpulse · während des Impulses geschützt", "${s.boostTime>0?'Schub aktiv · ':''}${s.boost}/3 Schubimpulse")
    .replace("result(s){return `${s.hits} Treffer", "result(s){if(s.v===3)return s.swirlPassages+' vollständige Wirbelpassagen in diesem Level.';return `${s.v===4?s.boostDodges+' Schub-Ausweichmanöver · ':''}${s.hits} Treffer");
}
