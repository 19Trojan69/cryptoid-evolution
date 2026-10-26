import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { lockGameViewport } from '../lib/gameViewport';

export default function GameRoute({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => root.current ? lockGameViewport(root.current) : undefined, []);
  return <div className="game-route" ref={root}>{children}</div>;
}
