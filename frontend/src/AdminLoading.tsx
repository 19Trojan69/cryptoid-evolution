import { useAdminLocale } from './adminLocale';

export default function AdminLoading() {
  const { t } = useAdminLocale();
  return <p role="status">{t('Loading admin center…')}</p>;
}
