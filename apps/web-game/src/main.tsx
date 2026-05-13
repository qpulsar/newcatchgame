import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css' // Vanilla CSS tema değişkenleri
import './index.css' // Diğer olası Vite stilleri (veya silebiliriz)
import App from './App.tsx'

import './i18n'; // i18n altyapısını başlat
import { ThemeProvider } from './contexts/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
