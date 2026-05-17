import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Play } from './pages/Play';
import { LevelEditor } from './pages/LevelEditor';
import { AdminPanel } from './pages/AdminPanel';
import { TeacherPanel } from './pages/TeacherPanel';
import { CreateGame } from './pages/CreateGame';
import { AssetLibrary } from './pages/AssetLibrary';
import { SettingsPage } from './pages/SettingsPage';

// Korumalı rota bileşeni (Basit versiyon)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  // Otomatik giriş (Test için URL parametresi kontrolü)
  const urlParams = new URLSearchParams(window.location.search);
  const authToken = urlParams.get('auth_token');
  const userData = urlParams.get('user_data');
  
  if (authToken && userData && userData !== 'undefined') {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', userData);
    // Parametreleri temizle ve sayfayı yenile
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  React.useEffect(() => {
    const rawPreferences = window.localStorage.getItem('ui_preferences');
    if (!rawPreferences) {
      return;
    }

    try {
      const preferences = JSON.parse(rawPreferences);
      document.documentElement.style.fontSize = `${preferences.fontSize || 16}px`;
      document.documentElement.classList.toggle('high-contrast', Boolean(preferences.highContrast));
      document.documentElement.classList.toggle('reduced-motion', Boolean(preferences.reduceMotion));
    } catch (error) {
      console.error('Failed to parse UI preferences:', error);
    }
  }, []);

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
        <Route 
          path="/play" 
          element={
            <ProtectedRoute>
              <Play />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-game" 
          element={
            <ProtectedRoute>
              <CreateGame />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/editor" 
          element={
            <ProtectedRoute>
              <LevelEditor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/editor/:id" 
          element={
            <ProtectedRoute>
              <LevelEditor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute>
              <TeacherPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/assets" 
          element={
            <ProtectedRoute>
              <AssetLibrary />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
