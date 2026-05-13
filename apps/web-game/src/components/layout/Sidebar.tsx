import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Gamepad2, Bug, Settings, HelpCircle, LogOut } from 'lucide-react';
import './layout.css';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

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
        <ul>
          <li className="active">
            <LayoutDashboard size={18} />
            <span>{t('sidebar.dashboard')}</span>
          </li>
          <li>
            <Users size={18} />
            <span>{t('sidebar.users')}</span>
          </li>
          <li>
            <Gamepad2 size={18} />
            <span>{t('sidebar.library')}</span>
          </li>
          <li>
            <Bug size={18} />
            <span>{t('sidebar.bugs')}</span>
          </li>
          <li>
            <Settings size={18} />
            <span>{t('sidebar.settings')}</span>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="btn-primary upload-btn">
          <span>+</span> {t('btn.upload')}
        </button>
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
