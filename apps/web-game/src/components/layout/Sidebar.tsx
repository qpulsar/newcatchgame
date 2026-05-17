import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Gamepad2, Bug, Settings, HelpCircle, LogOut, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import './layout.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const userStr = localStorage.getItem('user');
  const [user, setUser] = React.useState<any>((userStr && userStr !== 'undefined') ? JSON.parse(userStr) : {});
  
  const isAdmin = user.role === 'admin';
  const isTeacher = user.role === 'teacher' || isAdmin;

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      })
      .catch(err => console.error('Failed to sync user:', err));
    }
  }, []);

  const handleTestLogin = async (role: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/test-token/${role}`);
      if (response.ok) {
        const data = await response.json();
        if (data.user && data.access_token) {
          const url = `${window.location.origin}/?auth_token=${data.access_token}&user_data=${encodeURIComponent(JSON.stringify(data.user))}`;
          window.open(url, '_blank');
        } else {
          console.error('Test kullanıcısı verisi eksik');
        }
      }
    } catch (err) {
      console.error('Test girişi başarısız:', err);
    }
  };

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        {!isCollapsed && <h2>EduGame Studio</h2>}
        <button className="sidebar-toggle" onClick={onToggle}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="sidebar-profile">
        <div className="profile-icon">
          <LayoutDashboard size={20} />
        </div>
        {!isCollapsed && (
          <div className="profile-info">
            <span className="profile-title">{user.full_name || 'Kullanıcı'}</span>
            <span className="profile-subtitle">{user.role?.toUpperCase() || 'STUDENT'}</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <Link to="/create-game" style={{ textDecoration: 'none' }}>
          <button className="btn-primary upload-btn" style={{ 
            margin: isCollapsed ? '0 auto 20px' : '0 20px 20px 20px', 
            width: isCollapsed ? '40px' : 'calc(100% - 40px)',
            height: isCollapsed ? '40px' : 'auto',
            padding: isCollapsed ? '0' : '10px'
          }} title={t('btn.upload')}>
            <Gamepad2 size={18} /> 
            {!isCollapsed && <span>{t('btn.upload')}</span>}
          </button>
        </Link>
        <ul>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <li className={isActive('/') ? 'active' : ''} title={isCollapsed ? t('sidebar.dashboard') : ''}>
              <LayoutDashboard size={18} />
              {!isCollapsed && <span>{t('sidebar.dashboard')}</span>}
            </li>
          </Link>

          {isTeacher && (
            <Link to="/teacher" style={{ textDecoration: 'none' }}>
              <li className={isActive('/teacher') ? 'active' : ''} title={isCollapsed ? 'Öğretmen Paneli' : ''}>
                <GraduationCap size={18} />
                {!isCollapsed && <span>Öğretmen Paneli</span>}
              </li>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" style={{ textDecoration: 'none' }}>
              <li className={isActive('/admin') ? 'active' : ''} title={isCollapsed ? t('sidebar.users') : ''}>
                <Users size={18} />
                {!isCollapsed && <span>{t('sidebar.users')}</span>}
              </li>
            </Link>
          )}

          <Link to="/play" style={{ textDecoration: 'none' }}>
            <li className={isActive('/play') ? 'active' : ''} title={isCollapsed ? t('sidebar.library') : ''}>
              <Gamepad2 size={18} />
              {!isCollapsed && <span>{t('sidebar.library')}</span>}
            </li>
          </Link>
          <Link to="/assets" style={{ textDecoration: 'none' }}>
            <li className={isActive('/assets') ? 'active' : ''} title={isCollapsed ? 'Varlık Kütüphanesi' : ''}>
              <Bug size={18} />
              {!isCollapsed && <span>Varlık Kütüphanesi</span>}
            </li>
          </Link>
          <Link to="/settings" style={{ textDecoration: 'none' }}>
            <li className={isActive('/settings') ? 'active' : ''} title={isCollapsed ? t('sidebar.settings') : ''}>
              <Settings size={18} />
              {!isCollapsed && <span>{t('sidebar.settings')}</span>}
            </li>
          </Link>
        </ul>
      </nav>

      <div className="sidebar-footer">
        {isAdmin && (
          <div className="test-tools" style={{ padding: '0 20px 10px', marginBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>TEST ARAÇLARI</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => handleTestLogin('teacher')}
                style={{ flex: 1, padding: '6px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #3b82f6', background: 'none', color: '#3b82f6', cursor: 'pointer' }}
              >
                + Öğretmen
              </button>
              <button 
                onClick={() => handleTestLogin('student')}
                style={{ flex: 1, padding: '6px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #10b981', background: 'none', color: '#10b981', cursor: 'pointer' }}
              >
                + Öğrenci
              </button>
            </div>
          </div>
        )}
        <ul>
          <li title={isCollapsed ? t('btn.help') : ''}>
            <HelpCircle size={18} />
            {!isCollapsed && <span>{t('btn.help')}</span>}
          </li>
          <li onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.reload(); }} title={isCollapsed ? t('btn.logout') : ''}>
            <LogOut size={18} />
            {!isCollapsed && <span>{t('btn.logout')}</span>}
          </li>
        </ul>
      </div>
    </aside>
  );
};
