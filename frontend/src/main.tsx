import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobileMenus.css'
import './floatingNotices.css'
import './quickAccessMobile.css'
import './missionDialogMobile.css'
import './homeTypeMobile.css'
import './mobileDeepMenus.css'
import './hudDepth.css'
import './locales/typography.css'
import './selectionControls.css'
import './fleetMenus.css'
import App from './App.tsx'
import { startAggregateUsage } from './lib/aggregateUsage'
import { installReloadDiagnostics } from './pages/reloadDiagnostics'
import './smartphoneUi.css'
import './pages/feedbackCompact.css'

installReloadDiagnostics();
void startAggregateUsage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
