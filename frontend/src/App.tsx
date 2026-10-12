import { RouterProvider } from "react-router-dom";
import router from "./Router.tsx";
import { useEffect, useRef } from "react";
import { watchMenuViewport } from "./lib/menuViewport";
import { inspectGameSessionRestart, readGameDiagnosticContext, recordGameDiagnostic, downloadGameDiagnostics } from './pages/gameDiagnostics';

function App() {
  const diagnosticDownloadRequested = useRef(false);
  useEffect(watchMenuViewport, []);
  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    // Check at app startup as well: a browser restore can reopen Home without
    // mounting GamePage. This records a hint; it never redirects or resumes.
    inspectGameSessionRestart(undefined, recordGameDiagnostic, Date.now, navigation?.type);
    if (!diagnosticDownloadRequested.current && new URLSearchParams(window.location.search).get('cryptoid_diagnostics') === 'download') {
      diagnosticDownloadRequested.current = true;
      try { downloadGameDiagnostics(); } catch { /* A blocked download must not interrupt the app. */ }
    }
    let previous = router.state.location;
    return router.subscribe(state => {
      const next = state.location;
      if (previous.key === next.key) return;
      if (previous.pathname === '/game' || next.pathname === '/game') recordGameDiagnostic({
        ...readGameDiagnosticContext(), reason: 'navigation', errorName: '',
        navigationAction: state.historyAction, from: previous.pathname, to: next.pathname,
      });
      previous = next;
    });
  }, []);
  return <RouterProvider router={router} />;
}

export default App;
