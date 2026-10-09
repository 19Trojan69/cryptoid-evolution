import { createBrowserRouter } from "react-router-dom";
import Shop from "./pages/Shop";
import GamePage from "./pages/GamePage.tsx";
import PiSignInCallback from "./pages/PiSignInCallback.tsx";
import LegalPage from "./pages/LegalPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import RouteRecovery from "./RouteRecovery";

export const router = createBrowserRouter([
  {
    path: "/admin",
    element: <AdminPage />,
    errorElement: <RouteRecovery />,
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
