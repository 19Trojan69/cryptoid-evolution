import type { AutoReloadPreferences } from './weaponAutoReload';
import { useEffect, useRef, useState } from 'react';
import { axiosClient } from '../lib/axiosClient';
import { usePayments } from '../hooks/usePayments';
import { useLocale } from '../i18n';
import type { ShipStage } from './shipEvolution';
import WeaponPurchase from './WeaponPurchase';
import WeaponPreview from './WeaponPreview';
import WeaponTutorial from './WeaponTutorial';
import PiPrice from '../components/PiPrice';
import './missionWeaponShop.css';
import { shipSaveNetwork, selectedShip } from './shipFleet';
import { hangarCatalog } from '../../../backend/src/hangarCatalog';
import { isTestnetWeaponPurchaseEnabled } from '../../../backend/src/paymentPolicy';

type Offer = { id: string; kind: string; name: string; description: string; pricePi: number; level?: number };
type Props = { autoReload?: AutoReloadPreferences; onAutoReload?: (level: number, enabled: boolean) => void; authenticated: boolean; admin: boolean; timers: number[]; onInventory: (owned: string[], stock: Record<string, number>) => Promise<void>; onClose: () => void; initialStock?: Record<string, number>; activeLevel?: number; source?: string; pickupLevel?: number; pickupMs?: number; stage?: ShipStage; selectionBusy?: boolean; pendingLevel?: number; selectionError?: string; onSelect?: (level: number) => void; onPickup?: () => void };

export default function MissionWeaponShop({ autoReload = {}, onAutoReload, authenticated, admin, timers, onInventory, onClose, initialStock, activeLevel = 1, source = 'standard', pickupLevel = 1, pickupMs = 0, stage = 1, selectionBusy = false, pendingLevel, selectionError, onSelect, onPickup }: Props) {
  const { t, locale } = useLocale();
  const [offers, setOffers] = useState<Offer[]>(() => hangarCatalog.filter(offer => offer.kind === 'weapon'));
  const [stock, setStock] = useState<Record<string, number>>(initialStock ?? {});
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);
  const refreshVersion = useRef(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const inventoryCallback = useRef(onInventory);
  inventoryCallback.current = onInventory;
  const ship = selectedShip();
  const { orderProduct, isLoading, paymentDiagnostic, activeProductId, paymentStatus } = usePayments({ isAuthenticated: authenticated && !admin, onRequireAuth: () => setNotice('Connect your Pi account to see your saved loadout.') });
  const refresh = async () => {
    const version = ++refreshVersion.current;
    setRefreshing(true);
    setReady(false);
    try {
      const [{ data: catalog }, inventory] = await Promise.all([
        axiosClient.get<{ offers: Offer[] }>('/hangar/catalog'),
        authenticated ? axiosClient.get<{ ownedWeapons: string[]; weaponStock?: Record<string, number> }>('/hangar/inventory') : Promise.resolve(null),
      ]);
      if (!Array.isArray(catalog.offers) || (inventory && !Array.isArray(inventory.data.ownedWeapons))) throw new Error('Invalid inventory');
      if (!mounted.current || version !== refreshVersion.current) return;
      const weapons = inventory?.data.ownedWeapons ?? [];
      setOffers(catalog.offers.filter(offer => offer.kind === 'weapon'));
      setStock(inventory?.data.weaponStock ?? {});
      setReady(true);
      setNotice(authenticated ? '' : 'Connect your Pi account to see your saved loadout.');
      if (authenticated && !admin) void inventoryCallback.current(weapons, inventory?.data.weaponStock ?? {}).catch(() => {
        if (mounted.current && version === refreshVersion.current) setNotice('Not confirmed. Refresh inventory. Confirmed purchases will not be repeated.');
      });
    } catch {
      if (mounted.current && version === refreshVersion.current) setNotice('Not confirmed. Refresh inventory. Confirmed purchases will not be repeated.');
    } finally { if (mounted.current && version === refreshVersion.current) setRefreshing(false); }
  };
  useEffect(() => {
    mounted.current = true;
    const modal = titleRef.current?.closest('.pause-settings-modal');
    if (modal) modal.scrollTop = 0;
    titleRef.current?.focus({ preventScroll: true });
    void refresh();
    return () => { mounted.current = false; refreshVersion.current++; };
  }, [authenticated, admin]);
  useEffect(() => { if (initialStock) setStock(initialStock); }, [initialStock]);
  const busy = refreshing || isLoading || selectionBusy;
  const standard: Offer = { id: 'standard', kind: 'weapon', name: 'Standard', description: '', pricePi: 0, level: 1 };
  const items = [standard, ...offers].map(offer => {
    const level = offer.level ?? 1;
    const count = stock[offer.id] || 0;
    const timer = timers[level] ?? 0;
    const pickup = pickupLevel === level && pickupMs > 0;
    const available = pendingLevel === level || level === 1 || admin || count > 0 || timer > 0 || timer === -1 || pickup;
    return { offer, level, count, timer, pickup, available };
  }).sort((a, b) => Number(b.available) - Number(a.available) || b.level - a.level);
  return <section className="mission-weapon-shop" aria-labelledby="mission-weapon-shop-title" aria-busy={busy}>
    <header>
      <small>{t('MISSION PAUSED')}</small>
      <h2 id="mission-weapon-shop-title" ref={titleRef} tabIndex={-1}>{t('Weapons')}</h2>
      <p>{t('Owned weapons first · strongest first')}</p>
    </header>
    <div className="mission-shop-scroll">
    <p className="testnet-shop-notice">{shipSaveNetwork === 'testnet' ? t('Testnet: Twin Laser and Rapid Twin can be bought with Test-Pi. Triple Laser and Plasma purchases are locked.') : t('Pi purchases are currently locked. Collect weapon upgrades in game.')}</p>
    {admin && <p>{t('Admin test mode: purchases and records are not saved.')}</p>}
    <p className="mission-reload-explanation">{t('When a timed weapon expires, the strongest enabled weapon takes over; otherwise the standard laser. Auto-reload uses owned charges without pausing.')}</p>
    <div className="mission-weapon-offers">{items.map(({ offer, level, count, timer, pickup, available }) => {
      const locked = shipSaveNetwork !== 'testnet' || !isTestnetWeaponPurchaseEnabled(offer);
      const selected = activeLevel === level && (source !== 'pickup' || pickup);
      const usablePaid = pendingLevel === level || level === 1 || admin || timer !== 0 || count > 0;
      const blocked = busy || (!!pendingLevel && pendingLevel !== level);
      return <article className="hangar-offer mission-weapon-card" data-level={level} data-owned={available} data-active={selected} key={offer.id}>
        <WeaponPreview offerId={offer.id} sprite={ship.skin.sprite} color={ship.color.id} stage={stage} />
        <div className="mission-weapon-details">
          <h3><span aria-hidden="true">{['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][level]}</span> {t(offer.name)}</h3>
          <p className="mission-stock">{level === 1 ? t('Unlimited') : <>{t('Charges')}: <b>{authenticated && !ready ? '…' : count}</b></>}</p>
          <p className="mission-duration">{level > 1 ? t('1 minute per charge') : t('Base')}</p>
          <div className="mission-timers">{timer > 0 && <p className="mission-time">{t('Remaining time')}: {Math.ceil(timer / 1000)} s</p>}
          {pickup && <p className="mission-time">{t('Weapon pickup')}: {Math.ceil(pickupMs / 1000)} s</p>}
          </div>
          {level > 1 && onAutoReload && <div className="mission-reload-setting">
            <button type="button" role="switch" aria-checked={autoReload[level] === true} aria-label={`${t('Auto-reload')} · ${t(offer.name)}`} disabled={blocked || locked || !authenticated || admin || !ready} onClick={() => onAutoReload(level, !autoReload[level])}>
              <span>{t('Auto-reload')}</span><span className="mission-switch-state">{t(autoReload[level] ? 'On' : 'Off')}<i aria-hidden="true" /></span>
            </button>
          </div>}
          {level === 1 && <p className="mission-reload-base">{t('No reload required')}</p>}
          {onSelect && <button type="button" className="mission-select" aria-pressed={selected} disabled={!available || blocked || (!usablePaid && !pickup) || (level > 1 && !ready && !admin && !pickup && timer <= 0)} onClick={() => { if (selected) return; if (!usablePaid && pickup) onPickup?.(); else onSelect(level); }}>{selected ? t('Active weapon') : available ? t('Select') : t('Not in stock')}</button>}
          {pickup && usablePaid && onPickup && <button className="mission-pickup-select" type="button" disabled={blocked} aria-pressed={source === 'pickup' && activeLevel === level} onClick={onPickup}>{t('Select')} · {t('Weapon pickup')}</button>}
        </div>
        {level > 1 && (locked ? <div className="mission-locked"><strong>{t('MAINNET READY')}</strong><p><PiPrice amount={offer.pricePi} locale={locale} /></p><p>{t('Available only as a weapon pickup.')}</p></div> : <WeaponPurchase showStock={false} id={offer.id} price={offer.pricePi} count={count} pending={isLoading && activeProductId === offer.id} status={activeProductId === offer.id ? paymentStatus : undefined} diagnostic={activeProductId === offer.id ? paymentDiagnostic : undefined} disabledReason={admin ? "Admin test mode: purchases and records are not saved." : !authenticated ? "Connect your Pi account to see your saved loadout." : !ready ? notice || "Loading account save…" : undefined} disabled={!ready || busy || !authenticated || admin || !!pendingLevel} onBuy={(quantity, total) => { void orderProduct(`Cryptoid ${offer.name} · ${quantity} × 60s · Test-Pi`, total, { productId: offer.id, quantity, weaponModel: 2 }, async () => { if (mounted.current) await refresh(); }); }} />)}
      </article>;
    })}</div>
    <WeaponTutorial />
    <p role="status">{notice && t(notice)}</p>
    {selectionError && <p role="alert">{t(selectionError)}</p>}
    {paymentDiagnostic && !activeProductId && <p role="alert">{paymentDiagnostic}</p>}
    </div>
    <footer className="mission-shop-footer">
      <button type="button" className="mission-refresh" aria-label={t('Retry')} title={t('Retry')} disabled={busy || !!pendingLevel} onClick={() => { void refresh(); }}><span aria-hidden="true">↻</span></button>
      <button type="button" className="mission-return" disabled={busy || !!pendingLevel} onClick={onClose}>{t('Back to game')} <span aria-hidden="true">▷</span></button>
    </footer>
  </section>;
}
