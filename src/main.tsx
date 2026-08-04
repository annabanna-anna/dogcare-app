import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { refreshServiceWorker } from './lib/pushNotifications'

// Keeps the push service worker up to date on devices that already enabled
// reminders; a no-op everywhere else.
refreshServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
