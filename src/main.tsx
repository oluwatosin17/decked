import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initGalaxy } from './galaxy'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Galaxy runs completely outside React — immune to StrictMode double-invoke
initGalaxy()
