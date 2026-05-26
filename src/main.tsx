import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DialogProvider } from './contexts/DialogContext'
import App from './App'
import { APP_NAME } from './utils/constants'
import './index.css'

// Set document title and meta from centralized constant
document.title = APP_NAME
const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
if (appleTitleMeta) appleTitleMeta.setAttribute('content', APP_NAME)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
