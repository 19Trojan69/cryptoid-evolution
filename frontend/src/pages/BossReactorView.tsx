import { useId, type CSSProperties } from 'react';
import type { SectorBoss } from './sectorBoss';
import { coreActive, coreInterval } from './bossCore';
import { specialWeaponMount, specialWeaponBox, specialWeaponBarrels } from './bossSpecialWeapon';

/** A recessed, hull-textured weapons bay; no floating reactor disc. */
export default function BossReactorView({ boss }: { boss: SectorBoss }) {
  const id = useId().replace(/:/g, '');
  const mount = specialWeaponMount(boss);
  const box = specialWeaponBox(boss);
  const energy = boss.core?.lastShotColor ?? mount.energy;
  const exposed = coreActive(boss);
  const elapsed = boss.core?.elapsed ?? 0;
  const open = exposed ? Math.min(1, (boss.core?.volley ?? 0) > 0 ? 1 : elapsed / 900) : 0;
  const charge = exposed ? Math.min(1, elapsed / coreInterval(boss)) : 0;
  const firing = exposed && (boss.core?.volley ?? 0) > 0 && elapsed < 180;
  const recoil = firing ? (1 - elapsed / 180) * 7 : 0;
  const url = (part: string) => `url(#${id}-${part})`;
  const barrels = specialWeaponBarrels(mount.shape);
  const hatch = 'M22 9H78L93 28V125L73 151H27L7 125V28Z';
  const texture = <image href={boss.config.image} x={-box.left / box.width * 100} y={-box.top / box.height * 160} width={boss.width / box.width * 100} height={boss.height / box.height * 160} preserveAspectRatio="none" />;
  return <svg className={`boss-special-weapon${firing ? ' boss-special-weapon-firing' : ''}`} viewBox="0 0 100 160" preserveAspectRatio="none" style={{zIndex:exposed ? 6 : 1,left:box.left,top:box.top,width:box.width,height:box.height,'--weapon-energy':energy,'--weapon-charge':charge} as CSSProperties} aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-steel`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#121b24"/><stop offset=".22" stopColor={mount.metal}/><stop offset=".4" stopColor="#ccd0c5"/><stop offset=".55" stopColor={mount.metal}/><stop offset=".8" stopColor="#35414b"/><stop offset="1" stopColor="#131d27"/>
      </linearGradient>
      <linearGradient id={`${id}-armor`} x2=".8" y2="1"><stop stopColor="#c0bca6"/><stop offset=".22" stopColor={mount.metal}/><stop offset=".68" stopColor="#26343e"/><stop offset="1" stopColor="#101821"/></linearGradient>
      <linearGradient id={`${id}-bore`} x2="0" y2="1"><stop stopColor="#03080d"/><stop offset=".8" stopColor="#152a33"/><stop offset="1" stopColor={mount.energy}/></linearGradient>
      <clipPath id={`${id}-left`}><path d="M22 9H50V151H27L7 125V28Z"/></clipPath>
      <clipPath id={`${id}-right`}><path d="M50 9H78L93 28V125L73 151H50Z"/></clipPath>
    </defs>
    <g opacity={open}>
      <path d={hatch} fill="#050b10" stroke="#06090d" strokeWidth="7"/>
      <path d={hatch} fill="none" stroke={mount.metal} strokeWidth="2"/>
      <path d="M14 34V119M86 34V119" stroke="#677680" strokeWidth="4"/>
      <path d="M18 34V119M82 34V119" stroke="#17202a" strokeWidth="2"/>
      <path d="M22 29H78M22 45H78M22 61H78M22 77H78M22 93H78M22 109H78" stroke="#45515b" strokeWidth="2" opacity=".65"/>
    </g>
    <g className="boss-special-assembly" opacity={open} transform={`translate(0 ${-12 * (1-open) - recoil})`}>
      <path d="M28 20H72L83 41V86L70 113H30L17 86V41Z" fill="#060d13" transform="translate(3 5)"/>
      <path d="M28 20H72L83 41V86L70 113H30L17 86V41Z" fill={url('armor')} stroke="#a0aaa7" strokeWidth="1.2"/>
      <path d="M29 26H42V70L30 88H23V43ZM71 26H58V70L70 88H77V43Z" fill={mount.trim} stroke="#171f28" strokeWidth="2"/>
      <path d="M44 28H56V78H44Z" fill="#16232c"/>
      <path className="boss-reactor-pulse" d="M50 36L57 45V58L50 67L43 58V45Z" fill={energy}/>
      <path d="M47 33V67M53 33V67" className="boss-special-conductor"/>
      {[34,46,58,70].map(y=><path key={y} d={`M23 ${y}H34M66 ${y}H77`} stroke="#050b10" strokeWidth="3"/>)}
      {mount.shape === 'lance' || mount.shape === 'fork' ? <>
        <path d={mount.shape === 'fork' ? 'M24 73L37 64L42 117L35 148H23L18 109Z' : 'M27 63H40V148H25V88Z'} fill={url('steel')} stroke="#a4aaa5" strokeWidth="1"/>
        <path d={mount.shape === 'fork' ? 'M76 73L63 64L58 117L65 148H77L82 109Z' : 'M73 63H60V148H75V88Z'} fill={url('steel')} stroke="#a4aaa5" strokeWidth="1"/>
        <path d="M43 77H57V141H43Z" fill={url('bore')}/>
        <path d="M45 82V136M55 82V136" className="boss-special-conductor"/>
        {[87,103,119].map(y=><path key={y} d={`M24 ${y}H39M61 ${y}H76`} stroke={mount.trim} strokeWidth="5"/>)}
        <path d="M39 137H61L65 147L58 154H42L35 147Z" fill={url('steel')} stroke="#101820" strokeWidth="2"/>
        <path d="M43 145H57V150H43Z" fill="#03090f"/>
      </> : barrels.map(x => <g key={x}>
        <path d={`M${x-10} 68H${x+10}V138L${x+8} 151H${x-8}L${x-10} 138Z`} fill={url('steel')} stroke="#151e26" strokeWidth="2"/>
        {[82,98,114].map(y=><path key={y} d={`M${x-11} ${y}H${x+11}V${y+5}H${x-11}Z`} fill={mount.trim} stroke="#b6b7a3" strokeWidth=".8"/>)}
        <path d={`M${x-13} 132H${x+13}V145L${x+8} 153H${x-8}L${x-13} 145Z`} fill={url('steel')} stroke="#111923" strokeWidth="1.5"/>
        <path d={`M${x-7} 143H${x+7}V150H${x-7}Z`} fill="#01050a"/>
        <path d={`M${x-3} 72V125`} stroke="#d1d2bf" opacity=".45"/>
      </g>)}
      {mount.shape === 'siege' && <>
        <path d="M27 60H73L80 85L72 123H28L20 85Z" fill={url('steel')} stroke="#17232e" strokeWidth="2"/>
        <path d="M31 70H42V113H31ZM58 70H69V113H58Z" fill={mount.trim}/>
        <path d="M46 66H54V120H46Z" fill="#10222b"/>
        <path d="M49 74V110" className="boss-special-conductor"/>
        <path d="M23 117H77V139L67 154H33L23 139Z" fill={url('steel')} stroke="#111c28" strokeWidth="2"/>
        <path d="M34 139H66L62 152H38Z" fill="#03080d"/>
        <path d="M40 144H60V150H40Z" fill={url('bore')}/>
      </>}
      {[27,73].map(x=><g key={x}><path d={`M${x-2} 29H${x+2}V33H${x-2}Z`} fill="#e1d3ac"/><path d={`M${x-2} 81H${x+2}V85H${x-2}Z`} fill="#d1c099"/></g>)}
      {barrels.map(x=><path key={x} className="boss-special-muzzle" d={`M${x-4} 146H${x+4}V150H${x-4}Z`}/>)}
    </g>
    {(['left','right'] as const).map((side,i)=><g key={side} transform={`translate(${(i ? 1 : -1)*open*32} ${-open*4})`}>
      <g clipPath={url(side)}>
        {texture}
        <path d={hatch} fill="#030a10" opacity={open*.1}/>
        <path d="M50 10V151" stroke="#10161b" strokeWidth="2"/>
        <path d={i ? 'M53 16V141' : 'M47 16V141'} stroke={mount.metal} strokeWidth="1"/>
      </g>
      <path d={i ? 'M50 10H78L93 28V125L73 151H50' : 'M50 10H22L7 28V125L27 151H50'} fill="none" stroke="#10151a" strokeWidth="1.3" opacity={.35+open*.65}/>
      <path d={i ? 'M56 19H75L85 33' : 'M44 19H25L15 33'} fill="none" stroke="#d8d4ba" strokeWidth="1" opacity={open*.65}/>
    </g>)}
    {firing && barrels.map(x=><path key={x} d={`M${x-5} 148L${x-10} 157L${x-3} 155L${x} 177L${x+3} 155L${x+10} 157L${x+5} 148Z`} fill={mount.energy} opacity={1-elapsed/180}/>)}
  </svg>;
}
