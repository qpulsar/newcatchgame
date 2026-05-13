import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// Korumalı rota bileşeni (Basit versiyon)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const Dashboard = () => {
  const { t } = useTranslation();
  return (
    <MainLayout>
      <div style={{ padding: '20px' }}>
        <h1 style={{ marginBottom: '10px' }}>{t('overview.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('overview.desc')}</p>
        
        <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{t('stats.users')}</p>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>42,892</h2>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{t('stats.published')}</p>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>28</h2>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{t('stats.server')}</p>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>99.9%</h2>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Diğer rotalar buraya gelecek */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
