import { useState } from 'react';
import PiPrice from '../components/PiPrice';
import { useLocale } from '../i18n';
import './weaponStock.css';

export default function WeaponPurchase({ id, price, count, disabled, disabledReason, onBuy }: { id: string; price: number; count: number; disabled: boolean; disabledReason?: string; onBuy: (quantity: number, total: number) => void }) {
  const { t, locale } = useLocale();
  const [quantity, setQuantity] = useState('1');
  const value = Number(quantity), valid = Number.isInteger(value) && value >= 1 && value <= 99;
  const total = Math.round(price * (valid ? value : 0) * 10_000_000) / 10_000_000;
  return <div className="weapon-purchase">
    <p>{t('Charges')}: <strong>{count}</strong> · {t('1 minute per charge')}</p>
    <label htmlFor={`quantity-${id}`}>{t('Quantity')} (1–99)</label>
    <input id={`quantity-${id}`} type="number" inputMode="numeric" min="1" max="99" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} />
    <div className="weapon-quantity-presets">{[1, 5, 10].map(n => <button key={n} type="button" onClick={() => setQuantity(String(n))}>{n}</button>)}</div>
    <button className="button button-primary weapon-buy-button" type="button" aria-describedby={disabled && disabledReason ? `purchase-reason-${id}` : undefined} disabled={disabled || !valid} onClick={() => onBuy(value, total)}><span>{t('Buy with Test-Pi')}{valid ? ` · ${value} ×` : ''}</span><PiPrice amount={total} locale={locale} testnet /></button>
    {disabled && disabledReason && <p id={`purchase-reason-${id}`} className="weapon-purchase-reason" role="status">{t(disabledReason)}</p>}
  </div>;
}
