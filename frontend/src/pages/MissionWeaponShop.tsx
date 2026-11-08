import type { AutoReloadPreferences } from './weaponAutoReload';
import { useCallback, useEffect, useRef, useState } from 'react';
import { axiosClient } from '../lib/axiosClient';
import { usePayments } from '../hooks/usePayments';
import { useLocale } from '../i18n';
import type { ShipStage } from './shipEvolution';
import WeaponPurchase from './WeaponPurchase';
import PowerPreview from './PowerPreview';
import WeaponPreview from './WeaponPreview';
import WeaponTutorial from './WeaponTutorial';
import ReloadConfirmation from './ReloadConfirmation';
import PiPrice from '../components/PiPrice';
import { weaponSymbols } from './weaponSymbols';
import './missionWeaponShop.css';
import { shipSaveNetwork, selectedShip } from './shipFleet';
import { hangarCatalog } from '../../../backend/src/hangarCatalog';
import { isTestnetWeaponPurchaseEnabled, testPiPurchaseAllowed } from '../../../backend/src/paymentPolicy';
import { missionPowerOffers, type MissionPowerInventory } from '../../../backend/src/missionPower';

type Offer = { id: string; kind: string; name: string; description: string; pricePi: number; level?: number };
type Props = { reloadLevel?: number; autoReload?: AutoReloadPreferences; onAutoReload?: (level: number, enabled: boolean) => void; authenticated: boolean; admin: boolean; timers: number[]; refreshInventory: (force?: boolean) => Promise<boolean>; onClose: () => void; stock?: Record<string, number>; activeLevel?: number; source?: string; pickupLevel?: number; pickupMs?: number; stage?: ShipStage; selectionBusy?: boolean; pendingLevel?: number; selectionError?: string; onSelect?: (level: number) => void; onPickup?: () => void;
  powerInventory?: MissionPowerInventory; refreshPowers: () => Promise<void>; onPaymentBusy: (busy: boolean) => void;
};

export default function MissionWeaponShop({ reloadLevel, autoReload = {}, onAutoReload, authenticated, admin, timers, refreshInventory, onClose, stock, activeLevel = 1, source = 'standard', pickupLevel = 1, pickupMs = 0, stage = 1, selectionBusy = false, pendingLevel, selectionError, onSelect, onPickup, powerInventory, refreshPowers, onPaymentBusy }: Props) {
  const { t, locale } = useLocale();
  const [offers, setOffers] = useState<Offer[]>(() => hangarCatalog.filter(offer => offer.kind === 'weapon'));
  const [ready, setReady] = useState(false);
  const [ownerTestnet, setOwnerTestnet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<'weapons' | 'powers'>('weapons');
  const [powerRefreshing, setPowerRefreshing] = useState(false);
  const [powerRefreshFailed, setPowerRefreshFailed] = useState(false);
  const mounted = useRef(true);
  const refreshVersion = useRef(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ship = selectedShip();
  const { orderProduct, isLoading, paymentDiagnostic, activeProductId, paymentStatus } = usePayments({ isAuthenticated: authenticated && !admin, onRequireAuth: () => setNotice('Connect your Pi account to see your saved loadout.') });
  useEffect(() => {
    onPaymentBusy(isLoading);
    return () => onPaymentBusy(false);
  }, [isLoading, onPaymentBusy]);
  const refreshPowerStock = async () => {
    if (!authenticated || admin || shipSaveNetwork !== 'testnet') return;
    setPowerRefreshing(true);
    try {
      await refreshPowers();
      if (mounted.current) setPowerRefreshFailed(false);
    } catch {
      if (mounted.current) setPowerRefreshFailed(true);
    } finally {
      if (mounted.current) setPowerRefreshing(false);
    }
  };
  const selectTab = (next: typeof tab) => {
    if (tab === next) return;
    setTab(next);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (next === 'powers') void refreshPowerStock();
  };
  const refresh = useCallback(async (force = false) => {
    const version = ++refreshVersion.current;
    setRefreshing(true);
    setReady(false);
    try {
      const [{ data: catalog }, ownerAccess] = await Promise.all([
        axiosClient.get<{ offers: Offer[] }>('/hangar/catalog'),
        authenticated ? refreshInventory(force) : Promise.resolve(false),
      ]);
      if (!Array.isArray(catalog.offers)) throw new Error('Invalid catalog');
      if (!mounted.current || version !== refreshVersion.current) return;
      setOffers(catalog.offers.filter(offer => offer.kind === 'weapon'));
      setOwnerTestnet(shipSaveNetwork === 'testnet' && !admin && ownerAccess);
      setReady(true);
      setNotice(authenticated ? '' : 'Connect your Pi account to see your saved loadout.');
    } catch {
      if (mounted.current && version === refreshVersion.current) setNotice('Not confirmed. Refresh inventory. Confirmed purchases will not be repeated.');
    } finally { if (mounted.current && version === refreshVersion.current) setRefreshing(false); }
  }, [authenticated, admin, refreshInventory]);
  useEffect(() => {
    mounted.current = true;
    const modal = titleRef.current?.closest('.pause-settings-modal');
    if (modal) modal.scrollTop = 0;
    titleRef.current?.focus({ preventScroll: true });
    void refresh();
    const versionRef = refreshVersion;
    return () => { mounted.current = false; versionRef.current++; };
  }, [refresh]);
  const busy = isLoading || selectionBusy;
  const stockUnknown = authenticated && stock === undefined;
  const standard: Offer = { id: 'standard', kind: 'weapon', name: 'Standard', description: '', pricePi: 0, level: 1 };
  const items = [standard, ...offers].map(offer => {
    const level = offer.level ?? 1;
    const count = stock?.[offer.id] || 0;
    const timer = timers[level] ?? 0;
    const pickup = pickupLevel === level && pickupMs > 0;
    const available = pendingLevel === level || level === 1 || admin || count > 0 || timer > 0 || timer === -1 || pickup;
    return { offer, level, count, timer, pickup, available };
  }).sort((a, b) => Number(b.available) - Number(a.available) || b.level - a.level);
  return <section className="mission-weapon-shop" aria-labelledby="mission-weapon-shop-title" aria-busy={busy}>
    <header>
      <small>{t('MISSION PAUSED')}</small>
      <h2 id="mission-weapon-shop-title" ref={titleRef} tabIndex={-1}>{t(tab === 'weapons' ? 'Weapons' : 'Power-ups')}</h2>
      {shipSaveNetwork === 'testnet' && <nav className="mission-shop-tabs" aria-label={t('Available equipment')}>
        <button type="button" aria-pressed={tab === 'weapons'} disabled={busy} onClick={() => selectTab('weapons')}>{t('Weapons')}</button>
        <button type="button" aria-pressed={tab === 'powers'} disabled={busy} onClick={() => selectTab('powers')}>{t('Power-ups')}</button>
      </nav>}
      {tab === 'weapons' && <p>{t('Owned weapons first · strongest first')}</p>}
      {tab === 'weapons' && reloadLevel !== undefined && <ReloadConfirmation level={reloadLevel} />}
    </header>
    <div ref={scrollRef} className="mission-shop-scroll" data-game-scroll>
    {tab === 'weapons' ? <>
    <p className="testnet-shop-notice">{ownerTestnet ? t('Admin Testnet: earn Shards for all 20 ships. Paid items use Test-Pi only.') : shipSaveNetwork === 'testnet' ? t('Testnet: Twin Laser and Rapid Twin can be bought with Test-Pi. Triple Laser and Plasma purchases are locked.') : t('Pi purchases are currently locked. Collect weapon upgrades in game.')}</p>
    {admin && <p>{t('Admin test mode: purchases and records are not saved.')}</p>}
    <details className="mission-reload-explanation"><summary>{t('Auto-reload')}</summary><p>{t('When a timed weapon expires, the strongest enabled weapon takes over; otherwise the standard laser. Auto-reload uses owned charges without pausing.')}</p></details>
    <div className="mission-weapon-offers">{items.map(({ offer, level, count, timer, pickup, available }) => {
      const locked = shipSaveNetwork !== 'testnet' || !isTestnetWeaponPurchaseEnabled(offer, ownerTestnet);
      const selected = activeLevel === level && (source !== 'pickup' || pickup);
      const usablePaid = pendingLevel === level || level === 1 || admin || timer !== 0 || count > 0;
      const blocked = busy || (!!pendingLevel && pendingLevel !== level);
      return <article className="hangar-offer mission-weapon-card" data-level={level} data-owned={available} data-active={selected} key={offer.id}>
        <WeaponPreview offerId={offer.id} sprite={ship.skin.sprite} color={ship.color.id} stage={stage} />
        <div className="mission-weapon-details">
          <h3><span aria-hidden="true">{weaponSymbols[level]}</span> {t(offer.name)}</h3>
          <p className="mission-stock">{level === 1 ? t('Unlimited') : <>{t('Charges')}: <b>{stockUnknown ? '…' : count}</b></>}</p>
          <p className="mission-duration">{level > 1 ? t('45 seconds per charge') : t('Base')}</p>
          <div className="mission-timers">{timer > 0 && <p className="mission-time">{t('Remaining time')}: {Math.ceil(timer / 1000)} s</p>}
          {pickup && <p className="mission-time">{t('Weapon pickup')}: {Math.ceil(pickupMs / 1000)} s</p>}
          </div>
          {level > 1 && onAutoReload && <div className="mission-reload-setting">
            <button type="button" role="switch" aria-checked={autoReload[level] === true} aria-label={`${t('Auto-reload')} · ${t(offer.name)}`} disabled={blocked || locked || !authenticated || admin || !ready} onClick={() => onAutoReload(level, !autoReload[level])}>
              <span>{t('Auto-reload')}</span><span className="mission-switch-state">{t(autoReload[level] ? 'On' : 'Off')}<i aria-hidden="true" /></span>
            </button>
          </div>}
          {level === 1 && <p className="mission-reload-base">{t('No reload required')}</p>}
          {onSelect && <button type="button" className="mission-select" aria-pressed={selected} disabled={!available || busy} onClick={() => { if (selected && !pendingLevel) return; if (!usablePaid && pickup) onPickup?.(); else onSelect(level); }}>{pendingLevel === level ? t('Retry') : selected ? t('Active weapon') : available ? t('Select') : stockUnknown ? '…' : t('Not in stock')}</button>}
          {pickup && usablePaid && onPickup && <button className="mission-pickup-select" type="button" disabled={busy} aria-pressed={source === 'pickup' && activeLevel === level} onClick={onPickup}>{t('Select')} · {t('Weapon pickup')}</button>}
        </div>
        {level > 1 && (locked ? <details className="mission-locked"><summary>{t('Purchases locked')}</summary><strong>{t('MAINNET READY')}</strong><p>{t('Available only as a weapon pickup.')}</p><p>{t('Planned price')}: <PiPrice amount={offer.pricePi} locale={locale} /></p></details> : <WeaponPurchase showStock={false} id={offer.id} price={offer.pricePi} count={count} pending={isLoading && activeProductId === offer.id} status={activeProductId === offer.id ? paymentStatus : undefined} diagnostic={activeProductId === offer.id ? paymentDiagnostic : undefined} disabledReason={admin ? "Admin test mode: purchases and records are not saved." : !authenticated ? "Connect your Pi account to see your saved loadout." : !ready ? notice || "Loading account save…" : undefined} disabled={!ready || busy || !authenticated || admin || !!pendingLevel} onBuy={(quantity, total) => { void orderProduct(`Cryptoid ${offer.name} · ${quantity} × 45s · Test-Pi`, total, { productId: offer.id, quantity, weaponModel: 2 }, async () => { if (mounted.current) await refresh(true); }); }} />)}
      </article>;
    })}</div>
    <WeaponTutorial />
    </> : <div className="mission-power-offers">
      {missionPowerOffers.map(offer => {
        const count = (powerInventory?.stock[offer.powerUp] ?? 0) + Number(powerInventory?.pending?.power === offer.powerUp);
        const purchasable = shipSaveNetwork === 'testnet' && !admin && authenticated && testPiPurchaseAllowed(offer, 'Pi Testnet', ownerTestnet);
        return <article className="hangar-offer mission-power-offer" key={offer.id}>
          <PowerPreview offerId={offer.id} />
          <h3>{t(offer.name)}</h3>
          <p>{t(offer.description)}</p>
          <p className="mission-stock">{t('Charges')}: <b>{authenticated && !powerInventory ? '…' : count}</b></p>
          {purchasable ? <WeaponPurchase id={offer.id} price={offer.pricePi} count={count} showStock={false}
            pending={isLoading && activeProductId === offer.id} disabled={!ready || !powerInventory || powerRefreshing || powerRefreshFailed || busy || !!pendingLevel}
            status={activeProductId === offer.id ? paymentStatus : undefined}
            diagnostic={activeProductId === offer.id ? paymentDiagnostic : undefined}
            onBuy={(quantity, total) => {
              void orderProduct(`Cryptoid ${offer.name} · ${quantity} × · Test-Pi`, total,
                { productId: offer.id, quantity, powerModel: 1 }, refreshPowerStock);
            }} /> : <p className="mission-duration">{t('Purchases locked')}</p>}
        </article>;
      })}
      {powerRefreshFailed && <p role="status">{t('Not confirmed. Refresh inventory. Confirmed purchases will not be repeated.')}</p>}
    </div>}
    <p role="status">{notice && t(notice)}</p>
    {selectionError && <p role="alert">{t(selectionError)}</p>}
    {paymentDiagnostic && !activeProductId && <p role="alert">{paymentDiagnostic}</p>}
    </div>
    <footer className="mission-shop-footer">
      <button type="button" className="mission-refresh" aria-label={t('Retry')} title={t('Retry')} disabled={busy || refreshing || powerRefreshing} onClick={() => { void refresh(); if (tab === 'powers') void refreshPowerStock(); }}><span aria-hidden="true">↻</span></button>
      <button type="button" className="mission-return" disabled={busy || !!pendingLevel} onClick={onClose}>{t('Back to game')} <span aria-hidden="true">▷</span></button>
    </footer>
  </section>;
}
