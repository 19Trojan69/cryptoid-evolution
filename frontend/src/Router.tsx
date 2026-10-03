import { createBrowserRouter } from "react-router-dom";
import Shop from "./pages/Shop";
import GamePage from "./pages/GamePage.tsx";
import PiSignInCallback from "./pages/PiSignInCallback.tsx";
import LegalPage from "./pages/LegalPage.tsx";
import { lazy, Suspense } from "react";
import { useLocale } from "./i18n";
const AdminLoading = () => { const { t } = useLocale(); return <p role="status">{t("Loading admin center…")}</p>; };
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));

export const router = createBrowserRouter([
  {
    path: "/admin",
    element: (
      <Suspense fallback={<AdminLoading />}>
        <AdminPage />
      </Suspense>
    ),
  },
  {
    path: "/",
    element: <Shop />,
  },
  {
    path: "/game",
    element: <GamePage />,
  },
  {
    path: "/signin/callback",
    element: <PiSignInCallback />,
  },
  {
    path: "/privacy",
    element: <LegalPage kind="privacy" />,
  },
  {
    path: "/terms",
    element: <LegalPage kind="terms" />,
  },
]);

export default router;
