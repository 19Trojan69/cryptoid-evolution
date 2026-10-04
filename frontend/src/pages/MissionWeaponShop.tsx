import { useEffect, useRef, useState } from 'react';
import { axiosClient } from '../lib/axiosClient';
import { usePayments } from '../hooks/usePayments';
import { useLocale } from '../i18n';
import PiPrice from '../components/PiPrice';
import WeaponTutorial from './WeaponTutorial';
import './missionWeaponShop.css';
import { shipSaveNetwork } from './shipFleet';
import { isTestnetWeaponPurchaseEnabled } from '../../../backend/src/paymentPolicy';

type Offer = { id: string; kind: string; name: string; description: string; pricePi: number; level?: number };
type Props = { authenticated: boolean; admin: boolean; timers: number[]; onInventory: (owned: string[]) => Promise<void>; onClose: () => void };

export default function MissionWeaponShop({ authenticated, admin, timers, onInventory, onClose }: Props) {
  const { t, locale } = useLocale();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);
  const inventoryCallback = useRef(onInventory);
  inventoryCallback.current = onInventory;
  const { orderProduct, isLoading, paymentDiagnostic } = usePayments({ isAuthenticated: authenticated && !admin, onRequireAuth: () => setNotice('Connect your Pi account to see your saved loadout.') });
  const refresh = async () => {
    setRefreshing(true);
    setReady(false);
    try {
      const [{ data: catalog }, inventory] = await Promise.all([
        axiosClient.get<{ offers: Offer[] }>('/hangar/catalog'),
        authenticated ? axiosClient.get<{ ownedWeapons: string[] }>('/hangar/inventory') : Promise.resolve(null),
      ]);
      if (!Array.isArray(catalog.offers) || (inventory && !Array.isArray(inventory.data.ownedWeapons))) throw new Error('Invalid inventory');
      if (!mounted.current) return;
      const weapons = inventory?.data.ownedWeapons ?? [];
      setOffers(catalog.offers.filter(offer => offer.kind === 'weapon'));
      setOwned(weapons);
      if (authenticated && !admin) await inventoryCallback.current(weapons);
      if (!mounted.current) return;
      setReady(true);
      setNotice(authenticated ? '' : 'Connect your Pi account to see your saved loadout.');
    } catch {
      if (mounted.current) setNotice('Not confirmed. Refresh inventory. Confirmed purchases will not be repeated.');
    } finally { if (mounted.current) setRefreshing(false); }
  };
  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; };
  }, []);
  const busy = refreshing || isLoading;
  return <section className="mission-weapon-shop" aria-labelledby="mission-weapon-shop-title" aria-busy={busy}>
    <h2 id="mission-weapon-shop-title">{t('Weapon shop')}</h2>
    <p>{t('The mission stays paused. Close the shop, then choose Resume.')}</p>
    <WeaponTutorial initiallyOpen />
    <p>{t('Collected weapon upgrades activate immediately. If another timed weapon is available, its own side button lets you switch between them. Previously owned start boosts have a separate activation button.')}</p>
    <p className="testnet-shop-notice">{shipSaveNetwork === 'testnet' ? t('Testnet: Twin Laser and Rapid Twin can be bought with Test-Pi. Triple Laser and Plasma purchases are locked.') : t('Pi purchases are currently locked. Collect weapon upgrades in game.')}</p>
    {admin && <p>{t('Admin test mode: purchases and records are not saved.')}</p>}
    <div className="mission-weapon-offers">{offers.map(offer => {
      const available = owned.includes(offer.id);
      const locked = shipSaveNetwork !== 'testnet' || !isTestnetWeaponPurchaseEnabled(offer);
      const timer = timers[offer.level ?? 0] ?? 0;
      return <article className="hangar-offer" key={offer.id}>
        <h3><span aria-hidden="true">{['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][offer.level ?? 0]}</span> {t(offer.name)}</h3>
        <p>{t(offer.description)}</p>
        <strong>{t(available ? timer === 0 ? 'Used' : 'Owned — activate in game' : locked ? 'Locked' : 'NOT OWNED')}</strong>
        {locked ? <p>{t('Available only as a weapon pickup.')}</p> : <p><PiPrice amount={offer.pricePi} locale={locale} testnet /></p>}
        {!locked && !available && <button className="button button-primary" type="button" disabled={!ready || busy || !authenticated || admin} onClick={() => { void orderProduct(`Cryptoid ${offer.name} · Test-Pi`, offer.pricePi, { productId: offer.id }, () => { if (mounted.current) void refresh(); }); }}>{t('Buy with Test-Pi')}</button>}
      </article>;
    })}</div>
    <p role="status">{notice && t(notice)}</p>
    {paymentDiagnostic && <p role="alert">{paymentDiagnostic}</p>}
    <div className="modal-actions">
      <button type="button" className="button button-secondary" disabled={busy} onClick={() => { void refresh(); }}>{t('Retry')}</button>
      <button type="button" className="button button-primary" disabled={busy} onClick={onClose}>{t('Close shop')}</button>
    </div>
  </section>;
}
