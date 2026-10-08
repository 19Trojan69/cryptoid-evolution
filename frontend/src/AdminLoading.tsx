import { useLocale } from './i18n';

export default function AdminLoading() {
  const { t } = useLocale();
  return <p role="status">{t('Loading admin center…')}</p>;
}
