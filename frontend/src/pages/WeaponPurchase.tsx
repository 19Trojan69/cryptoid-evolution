import { useState } from 'react';
import PiPrice from '../components/PiPrice';
import { useLocale } from '../i18n';
import './weaponStock.css';

export default function WeaponPurchase({ id, price, count, disabled, onBuy }: { id: string; price: number; count: number; disabled: boolean; onBuy: (quantity: number, total: number) => void }) {
  const { t, locale } = useLocale();
  const [quantity, setQuantity] = useState('1');
  const value = Number(quantity), valid = Number.isInteger(value) && value >= 1 && value <= 99;
  const total = Math.round(price * (valid ? value : 0) * 10_000_000) / 10_000_000;
  return <div className="weapon-purchase">
    <p>{t('Charges')}: <strong>{count}</strong> · {t('1 minute per charge')}</p>
    <label htmlFor={`quantity-${id}`}>{t('Quantity')} (1–99)</label>
    <input id={`quantity-${id}`} type="number" inputMode="numeric" min="1" max="99" step="1" value={quantity} disabled={disabled} onChange={event => setQuantity(event.target.value)} />
    <div className="weapon-quantity-presets">{[1, 5, 10].map(n => <button key={n} type="button" disabled={disabled} onClick={() => setQuantity(String(n))}>{n}</button>)}</div>
    <button className="button button-primary" type="button" disabled={disabled || !valid} onClick={() => onBuy(value, total)}>{t('Buy with Test-Pi')} · {valid ? `${value} × · ` : ''}<PiPrice amount={total} locale={locale} testnet /></button>
  </div>;
}
