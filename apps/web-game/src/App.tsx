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
import { CreateGame } from './pages/CreateGame';
import { AssetLibrary } from './pages/AssetLibrary';

// Korumalı rota bileşeni (Basit versiyon)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
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
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPanel />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
