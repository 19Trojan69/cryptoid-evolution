export const patternStartLevel = 3;

const ringPatterns = `
function ringPattern(section) {
  if (section < ${patternStartLevel}) return '';
  return section % 2 ? 'Zickzack' : 'Pendel';
}
function patternedRoute(rng, section) {
  const name = ringPattern(section);
  if (!name) return routePlan(rng);
  const lanes = name === 'Zickzack'
    ? [0, 3, 1, 2, 0, 3, 1, 2, 0, 3, 1, 2]
    : [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1];
  const mirror = rng() < .5;
  return lanes.map(lane => 96 * (1 + (mirror ? 3 - lane : lane)));
}
`;

const convoyPatterns = `function attackFromBothSides(s) {
  return s.section >= ${patternStartLevel} && s.encounters % 3 === 1;
}
function waveSize(s) {
  return attackFromBothSides(s) || s.v===2 || s.v===4 ? 2 : 1;
}
function enemies(s) {
  const count = waveSize(s);
  if (s.enemies.length + count > 5) return;
  const flanking = attackFromBothSides(s);
  for (let i=0; i<count; i++) {
    let x;
    if (flanking) x = i === 0 ? 85 : 395;
    else if (s.v===4) x = (s.encounters % 2 ? 390 : 90) + i * 35;
    else x = s.encounters===0 ? 240 : [70,185,310,425][s.encounters % 4] + (s.rng() - .5) * 12;
    x = C.clamp(x, 60, 420);
    const hp = s.v===3 ? 5 : s.v===5 ? 4 : 3;
    s.enemies.push({
      id: ++s.spawned, x, y: -60 - i * (flanking ? 20 : 75), homeX: x,
      age: 0, hp, maxHp: hp, nextShot: 3 + i * (flanking ? .8 : .5),
      charge: null, shotCount: 0, model: s.spawned % 2 ? 'red-comet' : 'dark-delta', angle: Math.PI,
      escortTarget: flanking ? (i === 0 ? 0 : s.convoy.length - 1) : null,
    });
  }
  s.encounters++;
}`;

export function withArcadePatterns(html: string, game: number) {
  if (game === 4) {
    return html
      .replace("C.modules.G04={", `${ringPatterns}\nC.modules.G04={`)
      .replace("create(v,seed=Math.floor(Math.random()*4294967296))", "create(v,seed=Math.floor(Math.random()*4294967296),section=1)")
      .replace("route:routePlan(s.rng)", "route:patternedRoute(s.rng,section),routeName:ringPattern(section)")
      .replace("const side=(index+s.branchMirror)%2", "const side=s.routeName ? s.route[index]>=240 : (index+s.branchMirror)%2")
      .replace("s.spawnClock=3.45;", "s.spawnClock=s.routeName==='Zickzack' ? (index % 2 === 0 ? 2.65 : 4.25) : 3.45;")
      .replace("Ringe passiert${s.v===3?", "Ringe passiert${s.routeName?' · '+s.routeName:''}${s.v===3?");
  }
  if (game === 8) {
    return html
      .replace(/function enemies\(s\)\{[^\n]+/, convoyPatterns)
      .replace(
        "if(s.v===4)s.warning=s.spawnClock<2&&s.spawnClock>0&&s.time>8+s.spawnClock&&s.enemies.length<5?s.spawnClock:0;",
        `const upcomingPincer=attackFromBothSides(s);
 if(s.spawnClock<2&&s.spawnClock>0&&s.time>8+s.spawnClock&&s.enemies.length+waveSize(s)<=5) {
   s.warning=upcomingPincer ? 'Zangenangriff' : s.v===4 ? 'Hinterhalt '+(s.encounters%2?'rechts':'links') : '';
 } else s.warning='';`,
      )
      .replace("shieldLocked:false,warning:0", "shieldLocked:false,warning:''")
      .replace("s.convoy[(e.id+e.shotCount)%s.convoy.length]", "s.convoy[e.escortTarget ?? (e.id+e.shotCount)%s.convoy.length]")
      .replace("if(s.warning>0)G.label(g,'HINTERHALT '+(s.encounters%2?'RECHTS':'LINKS'),240,86", "if(s.warning)G.label(g,s.warning.toUpperCase(),240,86")
      .replace("Zusatzschüsse · ${s.v===3?'Schild '", "Zusatzschüsse · ${s.warning || (s.v===3?'Schild '")
      .replace("'Automatisches Grundfeuer · Kugeln geben je 5 Shots'}`;", "'Automatisches Grundfeuer · Kugeln geben je 5 Shots')}`;");
  }
  return html;
}
