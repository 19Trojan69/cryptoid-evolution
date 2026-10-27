import PiPrice from '../components/PiPrice';
import { useLocale } from '../i18n';

type Props = {
  price: number;
  disabled?: boolean;
  pending?: boolean;
  reason?: string;
  status?: string;
  diagnostic?: string;
  onBuy: () => void;
};

export default function TestPiPurchase({ price, disabled, pending, reason, status, diagnostic, onBuy }: Props) {
  const { t, locale } = useLocale();
  return <div className="weapon-purchase">
    <button className="button button-secondary" type="button" disabled={disabled || pending} aria-busy={pending || undefined} onClick={onBuy}>
      {pending && <span className="weapon-payment-spinner" aria-hidden="true" />}
      {t('Buy with Test-Pi')} · <PiPrice amount={price} locale={locale} testnet />
    </button>
    {reason && disabled && <small role="status">{t(reason)}</small>}
    {status && <p className="weapon-purchase-status" role="status">{t(status)}</p>}
    {diagnostic && <p className="weapon-purchase-error" role="alert">{t('Payment could not be confirmed. Check your account and retry.')}<small>{diagnostic}</small></p>}
  </div>;
}
