import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Gamepad2, Bug, Settings, HelpCircle, LogOut } from 'lucide-react';
import './layout.css';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <h2>EduGame Studio</h2>
      </div>

      <div className="sidebar-profile">
        <div className="profile-icon">
          <LayoutDashboard size={20} />
        </div>
        <div className="profile-info">
          <span className="profile-title">Yönetici Paneli</span>
          <span className="profile-subtitle">V2.4.0 KURUMSAL</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/create-game" style={{ textDecoration: 'none' }}>
          <button className="btn-primary upload-btn" style={{ margin: '0 20px 20px 20px', width: 'calc(100% - 40px)' }}>
            <Gamepad2 size={18} /> {t('btn.upload')}
          </button>
        </Link>
        <ul>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <li className={isActive('/') ? 'active' : ''}>
              <LayoutDashboard size={18} />
              <span>{t('sidebar.dashboard')}</span>
            </li>
          </Link>
          <Link to="/admin" style={{ textDecoration: 'none' }}>
            <li className={isActive('/admin') ? 'active' : ''}>
              <Users size={18} />
              <span>{t('sidebar.users')}</span>
            </li>
          </Link>
          <Link to="/play" style={{ textDecoration: 'none' }}>
            <li className={isActive('/play') ? 'active' : ''}>
              <Gamepad2 size={18} />
              <span>{t('sidebar.library')}</span>
            </li>
          </Link>
          <Link to="/assets" style={{ textDecoration: 'none' }}>
            <li className={isActive('/assets') ? 'active' : ''}>
              <Bug size={18} />
              <span>Varlık Kütüphanesi</span>
            </li>
          </Link>
          <li>
            <Settings size={18} />
            <span>{t('sidebar.settings')}</span>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">

        <ul>
          <li>
            <HelpCircle size={18} />
            <span>{t('btn.help')}</span>
          </li>
          <li onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>
            <LogOut size={18} />
            <span>{t('btn.logout')}</span>
          </li>
        </ul>
      </div>
    </aside>
  );
};
