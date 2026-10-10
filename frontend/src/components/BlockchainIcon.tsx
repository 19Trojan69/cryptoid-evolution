import { useId } from "react";

type Props = { kind: string; className?: string };

/** Original circuit symbols, sharing the same hexagonal network geometry. */
export default function BlockchainIcon({ kind, className = "" }: Props) {
  const iconKind = kind === "hangar" || kind === "shop" ? "fleet" : kind === "leaders" || kind === "ranks" || kind === "rewards" || kind === "progress" ? "career" : kind === "profile" ? "account" : ["language","controls","audio","display","vibration"].includes(kind) ? "settings" : kind;
  const metalId = `icon-metal-${useId().replace(/:/g, "")}`;
  return <svg className={`blockchain-icon ${className}`} viewBox="0 0 48 48" fill="none" stroke={iconKind === "network" ? "currentColor" : `url(#${metalId})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <defs><linearGradient id={metalId} x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stopColor="white" /><stop offset=".23" stopColor="currentColor" /><stop offset=".46" stopColor="currentColor" stopOpacity=".7" /><stop offset=".53" stopColor="white" /><stop offset=".68" stopColor="currentColor" /><stop offset="1" stopColor="currentColor" stopOpacity=".8" /></linearGradient></defs>
    <path className="blockchain-icon-frame" d="m24 3 18 10v22L24 45 6 35V13Z" />
    {iconKind === "galaxy" ? <><circle cx="24" cy="24" r="5"/><ellipse cx="24" cy="24" rx="17" ry="8" transform="rotate(-35 24 24)"/><ellipse cx="24" cy="24" rx="17" ry="8" transform="rotate(35 24 24)"/><circle cx="36" cy="14" r="2" fill="currentColor"/></> : iconKind === "mission" ? <><path d="m24 10 9 23-9-5-9 5Z" /><path d="M20 36v3m8-3v3M24 17v8" /></>
      : iconKind === "fleet" ? <><path d="M11 30V16l13-7 13 7v14M10 36h28M15 32l9-19 9 19-9-4Zm9-13v6" /><path d="M20 36v3m8-3v3" /></>
      : iconKind === "career" ? <><path d="m24 11 4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z" /><path d="M19 39h10" /></>
      : iconKind === "settings" ? <><g className="blockchain-icon-rotor"><path d="m24 11 4 2 4-1 4 6-2 4 2 4-4 7-4-1-4 3-4-3-4 1-4-7 2-4-2-4 4-6 4 1Z" /><circle cx="24" cy="23" r="6" /><path d="M24 17v3m0 6v3m-6-6h3m6 0h3" /></g><path d="M24 4v3m17 10-3 2M7 32l3-2" /></>
      : iconKind === "info" ? <><path d="m24 12 10 6v12l-10 6-10-6V18Z" /><path d="M24 22v8m0-13v1M7 24h4m26 0h4" /></>
      : iconKind === "account" ? <><path d="m24 11 11 4v9c0 7-6 11-11 14-5-3-11-7-11-14v-9Z" /><circle cx="24" cy="21" r="4" /><path d="M18 30c1-5 11-5 12 0" /></>
      : iconKind === "weapons" ? <><path d="m15 34 7-20 6-2 5 5-2 6-16 11Z"/><path d="m27 14 8-8m-4 13 10-6M12 29l7 7m-8-4-3 7 7-3"/></>
      : iconKind === "collection" ? <><path d="M15 14h19v24H15Z"/><path d="M10 32V9h19M20 22l5-4 5 4-5 7Z"/></>
      : iconKind === "feedback" ? <><path d="M12 12h25v20H25l-8 7v-7h-5Z"/><path d="M18 19h13m-13 7h8"/></>
      : <><path d="m15 12 6 3v7l-6 3-6-3v-7Zm18 11 6 3v7l-6 3-6-3v-7Z" /><path d="m21 19 9 5M15 25v9h12" /><circle cx="33" cy="14" r="3" /><path d="M33 17v6" /></>}
  </svg>;
}
