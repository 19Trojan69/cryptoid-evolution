import { useCallback, useEffect, useRef, useState } from 'react';
import { axiosClient } from '../lib/axiosClient';
import { loadGalaxySnapshot, emptyGalaxySnapshot, readGalaxyGuestProgress } from './galaxyData';
import { SHIP_COLOR_KEY, SHIP_SKIN_KEY, shipSaveNetwork, shipSaveNetworkForHost } from './shipFleet';

function guestSnapshot() {
  const progress = readGalaxyGuestProgress(localStorage, shipSaveNetwork, shipSaveNetworkForHost(window.location.hostname));
  return { ...emptyGalaxySnapshot(), skin: localStorage.getItem(SHIP_SKIN_KEY) || 'grey-scout', color: localStorage.getItem(SHIP_COLOR_KEY) || 'grey', progress };
}

export default function useGalaxyData(expectedOwner?: string) {
  const [snapshot, setSnapshot] = useState(emptyGalaxySnapshot);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [request, setRequest] = useState(0);
  const previousOwner = useRef(expectedOwner);
  const refresh = useCallback(() => { setStatus('loading'); setRequest(value => value + 1); }, []);
  useEffect(() => {
    let active = true;
    const rememberedAccount = expectedOwner || previousOwner.current || (localStorage.getItem('cryptoid_pi_session') === '1' ? '__signed_in__' : undefined);
    // The marker only forbids falling back to guest data; it is not a user identity.
    void loadGalaxySnapshot(path => axiosClient.get(path), shipSaveNetwork, guestSnapshot, rememberedAccount === '__signed_in__' ? undefined : rememberedAccount)
      .then(data => {
        if (!active) return;
        if (rememberedAccount && !data.owner) { setStatus('error'); return; }
        previousOwner.current = data.owner ?? undefined;
        setSnapshot(data); setStatus('ready');
      }, () => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [expectedOwner, request]);
  return { snapshot, status, refresh };
}
