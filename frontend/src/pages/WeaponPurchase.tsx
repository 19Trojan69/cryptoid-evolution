import { useState } from 'react';
import PiPrice from '../components/PiPrice';
import { useLocale } from '../i18n';
import './weaponStock.css';

export default function WeaponPurchase({ id, price, count, disabled, disabledReason, status, diagnostic, pending, onBuy }: { id: string; price: number; count: number; disabled: boolean; disabledReason?: string; status?: string; diagnostic?: string; pending?: boolean; onBuy: (quantity: number, total: number) => void }) {
  const { t, locale } = useLocale();
  const [quantity, setQuantity] = useState('1');
  const value = Number(quantity), valid = Number.isInteger(value) && value >= 1 && value <= 99;
  const total = Math.round(price * (valid ? value : 0) * 10_000_000) / 10_000_000;
  return <div className="weapon-purchase">
    <p className="weapon-stock-count">{t('Charges')}: <strong>{count}</strong></p>
    <div className="weapon-purchase-controls">
      <div className="weapon-quantity-control">
        <label htmlFor={`quantity-${id}`}>{t('Quantity')}</label>
        <input id={`quantity-${id}`} type="number" inputMode="numeric" min="1" max="99" step="1" value={quantity} aria-invalid={!valid} disabled={pending} onChange={event => setQuantity(event.target.value)} />
      </div>
      <div className="weapon-quantity-presets">{[1, 5, 10].map(n => <button key={n} type="button" aria-label={`${t('Quantity')}: ${n}`} aria-pressed={value === n} disabled={pending} onClick={() => setQuantity(String(n))}>{n}</button>)}</div>
      <button className="weapon-buy-button" type="button" aria-label={`${t('Buy with Test-Pi')} · ${valid ? value : 0} · ${total.toLocaleString(locale)} π`} aria-describedby={disabled && disabledReason ? `purchase-reason-${id}` : undefined} aria-busy={pending} disabled={disabled || !valid} onClick={() => onBuy(value, total)}>{pending ? <span className="weapon-payment-spinner" aria-hidden="true" /> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 4h2l3 12h10l3-9H6M10 20h.01M18 20h.01" strokeLinecap="round" strokeLinejoin="round" /></svg>}<PiPrice amount={total} locale={locale} testnet /></button>
    </div>
    {status && <p className="weapon-purchase-status" role="status">{t(status)}</p>}
    {diagnostic && <p className="weapon-purchase-error" role="alert">{t('Payment could not be confirmed. Check your account and retry.')}<small>{diagnostic}</small></p>}
    {disabled && disabledReason && !pending && <p id={`purchase-reason-${id}`} className="weapon-purchase-reason" role="status">{t(disabledReason)}</p>}
  </div>;
}
