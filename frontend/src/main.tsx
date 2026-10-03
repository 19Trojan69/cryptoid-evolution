import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobileMenus.css'
import './floatingNotices.css'
import './quickAccessMobile.css'
import App from './App.tsx'
import { startAggregateUsage } from './lib/aggregateUsage'

void startAggregateUsage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
