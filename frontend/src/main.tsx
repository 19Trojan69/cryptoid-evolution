import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './gameViewport.css'
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
import './smartphoneUi.css'
import './pages/feedbackCompact.css'
import { startCssFramePacing } from './lib/cssFramePacing'

void startAggregateUsage();

const root = document.getElementById('root')!;
// Dialogs/cards rendered through React portals are children of body, too.
const stopFramePacing = startCssFramePacing(document.body);
if (import.meta.hot) import.meta.hot.dispose(stopFramePacing);
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
