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
import App from './App.tsx'
import { startAggregateUsage } from './lib/aggregateUsage'

void startAggregateUsage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
