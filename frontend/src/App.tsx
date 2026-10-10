import { RouterProvider } from "react-router-dom";
import router from "./Router.tsx";
import { useEffect } from "react";
import { watchMenuViewport } from "./lib/menuViewport";

function App() {
  useEffect(watchMenuViewport, []);
  return <RouterProvider router={router} />;
}

export default App;
