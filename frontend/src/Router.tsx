import { createBrowserRouter } from "react-router-dom";
import Shop from "./pages/Shop";
import GamePage from "./pages/GamePage.tsx";
import PiSignInCallback from "./pages/PiSignInCallback.tsx";

export const router = createBrowserRouter([
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
]);

export default router;
