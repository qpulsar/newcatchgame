import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css' // Vanilla CSS tema değişkenleri
import './index.css' // Diğer olası Vite stilleri (veya silebiliriz)
import App from './App.tsx'

import './i18n'; // i18n altyapısını başlat
import { ThemeProvider } from './contexts/ThemeContext.tsx';

// Global Fetch Interceptor for Session Timeout
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await originalFetch(input, init);
  if (response.status === 401 && localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert("Oturum süreniz dolmuştur. Lütfen yeniden giriş yapın.");
    window.location.href = '/login';
  }
  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
