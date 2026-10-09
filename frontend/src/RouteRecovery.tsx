import { useLocale } from "./i18n";

export default function RouteRecovery() {
  const { t } = useLocale();
  return (
    <main className="admin-shell">
      <section className="admin-panel" role="alert">
        <h1>{t("This page could not be loaded.")}</h1>
        <p>{t("Reload to open the current version. Your saved data is preserved.")}</p>
        <button className="admin-button" type="button" onClick={() => window.location.reload()}>
          {t("Reload page")}
        </button>
        <a className="admin-button" href="/">{t("Return to home")}</a>
      </section>
    </main>
  );
}
