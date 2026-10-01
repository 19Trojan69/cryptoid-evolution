import { createBrowserRouter } from "react-router-dom";
import Shop from "./pages/Shop";
import GamePage from "./pages/GamePage.tsx";
import PiSignInCallback from "./pages/PiSignInCallback.tsx";
import LegalPage from "./pages/LegalPage.tsx";
import { lazy, Suspense } from "react";
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));

export const router = createBrowserRouter([
  {
    path: "/admin",
    element: (
      <Suspense fallback={<p role="status">Admin-Zentrale wird geladen …</p>}>
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
