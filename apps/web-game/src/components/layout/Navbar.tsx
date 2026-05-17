import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './layout.css';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(nextLang);
    window.localStorage.setItem('language', nextLang);
  };

  return (
    <header className="app-navbar">
      <nav className="nav-links">
        <a href="#" className="active">{t('nav.editor')}</a>
        <a href="#">{t('nav.marketplace')}</a>
        <a href="#">{t('nav.community')}</a>
        <a href="#">{t('nav.management')}</a>
      </nav>

      <div className="nav-actions">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder={t('search.placeholder')} />
        </div>

        <button className="icon-btn" onClick={handleLanguageToggle} title="Dili Değiştir">
          {i18n.language.toUpperCase()}
        </button>

        <button className="icon-btn" onClick={toggleTheme} title="Temayı Değiştir">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="icon-btn">
          <Bell size={20} />
        </button>

        <button className="icon-btn" onClick={() => navigate('/settings')} title="Sistem Ayarları">
          <Settings size={20} />
        </button>

        <div className="user-avatar">
          <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="User" />
        </div>
      </div>
    </header>
  );
};
