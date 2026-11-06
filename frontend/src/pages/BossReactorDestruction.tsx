import { useState, type CSSProperties } from 'react';

// One native animation, one local node. Release it directly on its own end
// event; WebKit may still report a running playState inside animationend.
export default function BossReactorDestruction({ style }: { style: CSSProperties }) {
  const [finished, setFinished] = useState(false);
  return finished ? null : <i className="boss-reactor-destruction" style={style} aria-hidden="true" onAnimationEnd={event => {
    if (event.target === event.currentTarget && event.animationName === 'boss-reactor-destroy') setFinished(true);
  }} />;
}
