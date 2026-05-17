import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import './layout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className="main-wrapper">
        <Navbar />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};
