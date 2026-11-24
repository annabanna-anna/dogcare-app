import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import DesignSystemApp from './DesignSystemApp'

createRoot(document.getElementById('ds-root')!).render(
  <StrictMode>
    <DesignSystemApp />
  </StrictMode>,
)
