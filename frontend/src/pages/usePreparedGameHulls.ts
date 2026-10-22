import { useEffect, useRef } from 'react';
import { hullSourcePlan, preparedHullPlan } from './hullSourcePlan';
import { preloadHullSources, retainPreparedHulls } from './paintedShip';
import { sessionDiagnostic } from '../lib/sessionDiagnosticEvents';

export function usePreparedGameHulls(sector: number, encounter: string, offset: number,
  wave: number, bonusGroup: number, rulesVersion: number) {
  const current = useRef<ReturnType<typeof retainPreparedHulls> | null>(null);
  useEffect(() => {
    sessionDiagnostic('boundary', { operation: 'hull-plan-start', sector, encounter });
    preloadHullSources(hullSourcePlan(sector, encounter, offset, wave));
    // Acquire the incoming plan before retiring the old one: both can contain
    // the same prewarmed hulls. A temporary zero-pin gap would evict them.
    const next = retainPreparedHulls(preparedHullPlan(sector, encounter, offset, wave, bonusGroup, rulesVersion));
    const previous = current.current;
    current.current = next;
    previous?.release();
    void next.settled.then(results => {
      if (current.current === next) sessionDiagnostic('boundary', { operation: 'hull-plan-settled', sector, encounter,
        requested: results.length, prepared: results.filter(Boolean).length, readinessFailures: results.filter(value => !value).length });
    });
  }, [sector, encounter, offset, wave, bonusGroup, rulesVersion]);
  useEffect(() => () => {
    current.current?.release();
    current.current = null;
  }, []);
}
