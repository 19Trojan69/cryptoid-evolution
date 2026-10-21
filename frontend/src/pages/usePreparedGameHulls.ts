import { useEffect, useRef } from 'react';
import { hullSourcePlan, preparedHullPlan } from './hullSourcePlan';
import { preloadHullSources, retainPreparedHulls } from './paintedShip';

export function usePreparedGameHulls(sector: number, encounter: string, offset: number,
  wave: number, bonusGroup: number, rulesVersion: number) {
  const current = useRef<ReturnType<typeof retainPreparedHulls> | null>(null);
  useEffect(() => {
    preloadHullSources(hullSourcePlan(sector, encounter, offset, wave));
    // Acquire the incoming plan before retiring the old one: both can contain
    // the same prewarmed hulls. A temporary zero-pin gap would evict them.
    const next = retainPreparedHulls(preparedHullPlan(sector, encounter, offset, wave, bonusGroup, rulesVersion));
    const previous = current.current;
    current.current = next;
    previous?.release();
  }, [sector, encounter, offset, wave, bonusGroup, rulesVersion]);
  useEffect(() => () => {
    current.current?.release();
    current.current = null;
  }, []);
}
