import { createBrowserRouter } from "react-router-dom";
import Shop from "./pages/Shop";
import PiSignInCallback from "./pages/PiSignInCallback.tsx";
import LegalPage from "./pages/LegalPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import RouteRecovery from "./RouteRecovery";

export const router = createBrowserRouter([
  {
    path: "/galaxy",
    lazy: async () => ({ Component: (await import("./pages/GalaxyMap")).default }),
    errorElement: <RouteRecovery />,
  },
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
    lazy: async () => ({ Component: (await import("./pages/GamePage")).default }),
    errorElement: <RouteRecovery />,
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
