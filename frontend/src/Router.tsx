import type { ComponentType } from "react";
import { createBrowserRouter, redirect } from "react-router-dom";
import PiSignInCallback from "./pages/PiSignInCallback.tsx";
import LegalPage from "./pages/LegalPage.tsx";
import RouteRecovery, { AdminRouteRecovery } from "./RouteRecovery";

const nftRoute = (load: () => Promise<{ default: ComponentType }>, testnetPath: string) => async () => {
  const { shipSaveNetwork } = await import("./pages/shipFleet");
  if (shipSaveNetwork === "testnet") return { loader: () => redirect(testnetPath) };
  return { Component: (await load()).default };
};

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
    path: "/admin/nfts",
    lazy: async () => ({ Component: (await import("./pages/NftAdminCollection")).default }),
    errorElement: <AdminRouteRecovery />,
  },
  {
    path: "/admin/nft-bosses",
    lazy: nftRoute(() => import("./pages/BossNftGallery"), "/admin/nfts?collection=bosses"),
    errorElement: <AdminRouteRecovery />,
  },
  {
    lazy: async () => ({ Component: (await import("./pages/NftMusic")).NftMusicLayout }),
    errorElement: <RouteRecovery />,
    children: [
      {
        path: "/nfts",
        lazy: nftRoute(() => import("./pages/NftOverview"), "/admin/nfts"),
      },
      {
        path: "/nft-bosses",
        lazy: nftRoute(() => import("./pages/BossNftPreview"), "/admin/nfts?collection=bosses"),
      },
      {
        path: "/nft-ships",
        lazy: nftRoute(() => import("./pages/ShipNftPreview"), "/admin/nfts?collection=ships"),
      },
    ],
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
