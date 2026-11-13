import { createBrowserRouter } from "react-router-dom";
import PiSignInCallback from "./pages/PiSignInCallback.tsx";
import LegalPage from "./pages/LegalPage.tsx";
import RouteRecovery, { AdminRouteRecovery } from "./RouteRecovery";

export const router = createBrowserRouter([
  {
    path: "/galaxy",
    lazy: async () => ({ Component: (await import("./pages/GalaxyMap")).default }),
    errorElement: <RouteRecovery />,
  },
  {
    path: "/admin",
    lazy: async () => ({ Component: (await import("./pages/AdminPage")).default }),
    errorElement: <AdminRouteRecovery />,
  },
  {
    path: "/admin/nft-bosses",
    lazy: async () => ({ Component: (await import("./pages/BossNftGallery")).default }),
    errorElement: <AdminRouteRecovery />,
  },
  {
    path: "/nft-bosses",
    lazy: async () => ({ Component: (await import("./pages/BossNftPreview")).default }),
    errorElement: <RouteRecovery />,
  },
  {
    path: "/nft-ships",
    lazy: async () => ({ Component: (await import("./pages/ShipNftPreview")).default }),
    errorElement: <RouteRecovery />,
  },
  {
    path: "/",
    lazy: async () => ({ Component: (await import("./pages/Shop")).default }),
    errorElement: <RouteRecovery />,
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
