import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useThemeStore } from './store/themeStore'

useThemeStore.getState().applyThemeSettings()
useThemeStore.persist.onFinishHydration(() => {
  useThemeStore.getState().applyThemeSettings()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
