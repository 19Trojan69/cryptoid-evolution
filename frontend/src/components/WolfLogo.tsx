import { useId } from "react";

export default function WolfLogo() {
  const id = useId();
  const glow = `${id}-glow`;
  const ray = `${id}-ray`;
  return <span className="brand-wolf-art">
    <img className="brand-wolf-logo" src="/trojan-wolf-games.webp" alt="Trojan Wolf Games" width="148" height="74" />
    {/* Match the image's contain sizing, including any max-height letterboxing. */}
    <svg className="brand-wolf-glint" viewBox="0 0 640 320" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".18" stopColor="#fff4d9" stopOpacity=".65" />
          <stop offset=".45" stopColor="#ffdfb1" stopOpacity=".22" />
          <stop offset="1" stopColor="#ffdfb1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ray}>
          <stop offset="0" stopColor="#ffdfb1" stopOpacity="0" />
          <stop offset=".46" stopColor="#ffdfb1" stopOpacity=".85" />
          <stop offset=".5" stopColor="#fff" />
          <stop offset=".54" stopColor="#ffdfb1" stopOpacity=".85" />
          <stop offset="1" stopColor="#ffdfb1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Eye centre in the original 640 × 320 artwork. */}
      <g className="wolf-eye-glint">
        <circle cx="248" cy="135" r="27" fill={`url(#${glow})`} />
        <rect x="204" y="133" width="88" height="4" rx="2" fill={`url(#${ray})`} />
        <rect x="219" y="133.5" width="58" height="3" rx="1.5" fill={`url(#${ray})`} transform="rotate(90 248 135)" opacity=".72" />
        <circle cx="248" cy="135" r="3.4" fill="#fff" />
      </g>
    </svg>
  </span>;
}
