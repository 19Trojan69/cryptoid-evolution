import { useState, type AnimationEvent, type HTMLAttributes } from 'react';

type Props = Omit<HTMLAttributes<HTMLElement>, 'onAnimationEnd'> & { tag: 'div' | 'i' };

// Preserve the authored effect until every native child/pseudo animation ends.
// The parent still owns its normal lifetime; this only releases finished DOM.
export default function FinishedEffect({ tag: Tag, ...props }: Props) {
  const [finished, setFinished] = useState(false);
  const complete = (event: AnimationEvent<HTMLElement>) => {
    const node = event.currentTarget;
    if (typeof node.getAnimations !== 'function') return;
    try {
      const animations = node.getAnimations({ subtree: true });
      if (animations.every(animation => animation.playState === 'finished' || animation.playState === 'idle')) {
        setFinished(true);
      }
    } catch { /* Unsupported native inspection keeps the original bounded lifetime. */ }
  };
  return finished ? null : <Tag {...props} onAnimationEnd={complete} />;
}
