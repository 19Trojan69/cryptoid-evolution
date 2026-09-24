import { createBrowserRouter } from "react-router-dom";
import Shop from "./pages/Shop";
import GamePage from "./pages/GamePage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Shop />,
  },
  {
    path: "/game",
    element: <GamePage />,
  },
]);

export default router;
