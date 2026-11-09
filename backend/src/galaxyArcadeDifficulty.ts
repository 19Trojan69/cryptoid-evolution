// The increase is strongest in the first few levels and approaches a playable limit.
export const arcadeLevelProgress = "C.levelProgress = level => (level - 1) / (level + 3);";

export function withArcadeDifficulty(html: string, game: number) {
  switch (game) {
    case 1:
      return html
        .replace(/130\+s\.elapsed\*\.6/g, "130+s.elapsed*.6+54*s.challenge")
        .replace("124+s.elapsed*.65", "124+s.elapsed*.65+54*s.challenge")
        .replace("s.rockClock=1.3+s.rng()*.5", "s.rockClock=(1.3+s.rng()*.5)*(1-.24*s.challenge)")
        .replace("s.shardClock=2.4", "s.shardClock=2.4*(1-.24*s.challenge)");
    case 2:
      return html
        .replace("r:21,vy:155", "r:21,vy:155+50*s.challenge")
        .replace("speed=78+s.elapsed*.6", "speed=78+s.elapsed*.6+46*s.challenge")
        .replace("s.spawnClock=1.3+s.rng()*.3", "s.spawnClock=(1.3+s.rng()*.3)*(1-.23*s.challenge)");
    case 4:
      return html
        .replace("const braking=s.v===3", "const ringSpeed=140+50*s.challenge;const braking=s.v===3")
        .replace("r:s.v===5?86:82", "r:(s.v===5?86:82)-8*s.challenge")
        .replace("const arrival=s.elapsed+(s.y+45)/140", "const arrival=s.elapsed+(s.y+45)/ringSpeed")
        .replace("braking?55:140", "braking?55:ringSpeed");
    case 5:
      return html
        .replace("r=s.v===1?[20,28,35][s.spawned%3]:27", "r=(s.v===1?[20,28,35][s.spawned%3]:27)*(1-.24*s.challenge)")
        .replace("t.age*.85+t.phase", "t.age*(.85+.38*s.challenge)+t.phase")
        .replace("t.age*.65+t.phase", "t.age*(.65+.32*s.challenge)+t.phase")
        .replace("t.age%2.8>=1.55", "t.age%2.8>=1.55+.52*s.challenge");
    case 6:
      return html
        .replace("const d=Math.hypot(base-x,575+30);s.missiles", "const d=Math.hypot(base-x,575+30),speed=85+40*s.challenge;s.missiles")
        .replace("vx:(base-x)/d*85,vy:605/d*85", "vx:(base-x)/d*speed,vy:605/d*speed")
        .replace("s.waveClock=s.v===1?3.2:s.v===5?4.6:4.0", "s.waveClock=s.v===5?4.6:(s.v===1?3.2:4.0)*(1-.2*s.challenge)");
    case 7:
      return html
        .replace("({x,y,r,leg,texture:i", "({x,y,homeX:x,homeY:y,r,leg,texture:i")
        .replace(
          "for(const r of s.rocks){const active=",
          `for(const r of s.rocks){
            const phase = s.elapsed * (.37 + .18 * s.challenge) + r.texture * 2;
            r.x = r.homeX + Math.sin(phase) * 52 * s.challenge;
            r.y = r.homeY + Math.sin(phase * .75) * 24 * s.challenge;
            const active=`,
        );
    case 8:
      return html
        .replace("s.spawnClock=s.v===2||s.v===4?6:4.6", "s.spawnClock=(s.v===2||s.v===4?6:4.6)*(1-.23*s.challenge)")
        .replace("const a=e.charge,d=Math.max(1,C.distance(a.origin,a.target));", "const a=e.charge,d=Math.max(1,C.distance(a.origin,a.target)),speed=150+55*s.challenge;")
        .replace("vx:(a.target.x-a.origin.x)/d*150,vy:(a.target.y-a.origin.y)/d*150", "vx:(a.target.x-a.origin.x)/d*speed,vy:(a.target.y-a.origin.y)/d*speed");
    default:
      return html;
  }
}
