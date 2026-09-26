import type { CSSProperties } from "react";

type Props = { value: number; onChange: (value: number) => void; label: string; id: string };

const MusicVolumeSlider = ({ value, onChange, label, id }: Props) => (
  <div className="music-volume-slider">
    <label htmlFor={id}><strong>{label}</strong><output htmlFor={id}>{value}%</output></label>
    <input id={id} type="range" min="0" max="100" step="1" value={value} onChange={event => onChange(Number(event.currentTarget.value))} aria-valuetext={`${value}%`} style={{ "--music-fill": `${value}%` } as CSSProperties} />
    <div className="music-volume-scale" aria-hidden="true"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
  </div>
);

export default MusicVolumeSlider;
