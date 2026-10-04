import { useEffect, useRef, useState } from 'react';
import { axiosClient } from '../lib/axiosClient';
import { usePayments } from '../hooks/usePayments';
import { useLocale } from '../i18n';
import PiPrice from '../components/PiPrice';
import WeaponTutorial from './WeaponTutorial';
import WeaponPurchase from './WeaponPurchase';
import './missionWeaponShop.css';
import { shipSaveNetwork } from './shipFleet';
import { isTestnetWeaponPurchaseEnabled } from '../../../backend/src/paymentPolicy';

type Offer = { id: string; kind: string; name: string; description: string; pricePi: number; level?: number };
type Props = { authenticated: boolean; admin: boolean; timers: number[]; onInventory: (owned: string[], stock: Record<string, number>) => Promise<void>; onClose: () => void };

export default function MissionWeaponShop({ authenticated, admin, timers, onInventory, onClose }: Props) {
  const { t, locale } = useLocale();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inventoryCallback = useRef(onInventory);
  inventoryCallback.current = onInventory;
  const { orderProduct, isLoading, paymentDiagnostic } = usePayments({ isAuthenticated: authenticated && !admin, onRequireAuth: () => setNotice('Connect your Pi account to see your saved loadout.') });
  const refresh = async () => {
    setRefreshing(true);
    setReady(false);
    try {
      const [{ data: catalog }, inventory] = await Promise.all([
        axiosClient.get<{ offers: Offer[] }>('/hangar/catalog'),
        authenticated ? axiosClient.get<{ ownedWeapons: string[]; weaponStock?: Record<string, number> }>('/hangar/inventory') : Promise.resolve(null),
      ]);
      if (!Array.isArray(catalog.offers) || (inventory && !Array.isArray(inventory.data.ownedWeapons))) throw new Error('Invalid inventory');
      if (!mounted.current) return;
      const weapons = inventory?.data.ownedWeapons ?? [];
      setOffers(catalog.offers.filter(offer => offer.kind === 'weapon'));
      setStock(inventory?.data.weaponStock ?? {});
      if (authenticated && !admin) await inventoryCallback.current(weapons, inventory?.data.weaponStock ?? {});
      if (!mounted.current) return;
      setReady(true);
      setNotice(authenticated ? '' : 'Connect your Pi account to see your saved loadout.');
    } catch {
      if (mounted.current) setNotice('Not confirmed. Refresh inventory. Confirmed purchases will not be repeated.');
    } finally { if (mounted.current) setRefreshing(false); }
  };
  useEffect(() => {
    mounted.current = true;
    const modal = titleRef.current?.closest('.pause-settings-modal');
    if (modal) modal.scrollTop = 0;
    titleRef.current?.focus({ preventScroll: true });
    void refresh();
    return () => { mounted.current = false; };
  }, []);
  const busy = refreshing || isLoading;
  return <section className="mission-weapon-shop" aria-labelledby="mission-weapon-shop-title" aria-busy={busy}>
    <h2 id="mission-weapon-shop-title" ref={titleRef} tabIndex={-1}>{t('Weapon shop')}</h2>
    <p>{t('The mission stays paused. Close the shop, then choose Resume.')}</p>
    <WeaponTutorial initiallyOpen />
    <p>{t('Collected weapon upgrades activate immediately. If another timed weapon is available, its own side button lets you switch between them. Previously owned start boosts have a separate activation button.')}</p>
    <p className="testnet-shop-notice">{shipSaveNetwork === 'testnet' ? t('Testnet: Twin Laser and Rapid Twin can be bought with Test-Pi. Triple Laser and Plasma purchases are locked.') : t('Pi purchases are currently locked. Collect weapon upgrades in game.')}</p>
    {admin && <p>{t('Admin test mode: purchases and records are not saved.')}</p>}
    <div className="mission-weapon-offers">{offers.map(offer => {
      const available = (stock[offer.id] || 0) > 0;
      const locked = shipSaveNetwork !== 'testnet' || !isTestnetWeaponPurchaseEnabled(offer);
      const timer = timers[offer.level ?? 0] ?? 0;
      return <article className="hangar-offer" key={offer.id}>
        <h3><span aria-hidden="true">{['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][offer.level ?? 0]}</span> {t(offer.name)}</h3>
        <p>{t('1 minute per charge')}</p>
        <strong>{t(locked ? 'Locked' : available || timer > 0 ? 'AVAILABLE' : 'NOT OWNED')}</strong>
        {locked ? <p>{t('Available only as a weapon pickup.')}</p> : <p><PiPrice amount={offer.pricePi} locale={locale} testnet /></p>}
        {!locked && <WeaponPurchase id={offer.id} price={offer.pricePi} count={stock[offer.id] || 0} disabledReason={admin ? "Admin test mode: purchases and records are not saved." : !authenticated ? "Connect your Pi account to see your saved loadout." : notice || "Loading account save…"} disabled={!ready || busy || !authenticated || admin} onBuy={(quantity, total) => { void orderProduct(`Cryptoid ${offer.name} · ${quantity} × 60s · Test-Pi`, total, { productId: offer.id, quantity, weaponModel: 2 }, () => { if (mounted.current) void refresh(); }); }} />}
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
