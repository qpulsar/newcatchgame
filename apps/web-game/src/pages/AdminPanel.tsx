import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { Users, Shield, UserCheck, UserX, Search, Activity, BookOpen, CheckCircle } from 'lucide-react';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

interface Attempt {
    id: number;
    full_name: string;
    level_title: string;
    score: number;
    date: string;
}

export const AdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'levels'>('users');
  const [users, setUsers] = useState<User[]>([
    { id: 1, email: 'admin@edugame.com', full_name: 'Sistem Yöneticisi', role: 'admin', status: 'active' },
    { id: 2, email: 'ogretmen@okul.com', full_name: 'Ahmet Yılmaz', role: 'teacher', status: 'active' },
    { id: 3, email: 'ogrenci@okul.com', full_name: 'Mehmet Demir', role: 'student', status: 'active' },
  ]);
  const [attempts, setAttempts] = useState<Attempt[]>([
      { id: 1, full_name: 'Mehmet Demir', level_title: 'Temel Fizik', score: 450, date: '2026-05-13 14:20' },
      { id: 2, full_name: 'Mehmet Demir', level_title: 'Hız ve İvme', score: 120, date: '2026-05-13 14:15' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <MainLayout>
      <div className="admin-content" style={{ padding: '24px' }}>
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Yönetici/Öğretmen Paneli</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Sistem kullanıcılarını ve öğrenci ilerlemelerini yönetin.</p>
          </div>
          <div className="admin-stats" style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toplam Öğrenci</span>
              <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>1,248</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Günlük Deneme</span>
              <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>85</div>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button 
                onClick={() => setActiveTab('users')}
                style={{ 
                    padding: '10px 20px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: activeTab === 'users' ? 'var(--primary-color)' : 'var(--bg-surface)',
                    color: activeTab === 'users' ? 'white' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                }}
            >
                <Users size={18} /> Kullanıcı Yönetimi
            </button>
            <button 
                onClick={() => setActiveTab('activity')}
                style={{ 
                    padding: '10px 20px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: activeTab === 'activity' ? 'var(--primary-color)' : 'var(--bg-surface)',
                    color: activeTab === 'activity' ? 'white' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                }}
            >
                <Activity size={18} /> Öğrenci Takibi
            </button>
            <button 
                onClick={() => setActiveTab('levels')}
                style={{ 
                    padding: '10px 20px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: activeTab === 'levels' ? 'var(--primary-color)' : 'var(--bg-surface)',
                    color: activeTab === 'levels' ? 'white' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                }}
            >
                <BookOpen size={18} /> Oyun İnceleme
            </button>
        </div>

        {activeTab === 'users' && (
            <section className="user-management" style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Kullanıcı Listesi</h2>
                <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                    type="text" 
                    placeholder="Kullanıcı ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                    padding: '8px 12px 8px 36px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    width: '250px'
                    }}
                />
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                    <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Kullanıcı</th>
                    <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Rol</th>
                    <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Durum</th>
                    <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>İşlemler</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '600' }}>{user.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        background: user.role === 'admin' ? 'rgba(170, 59, 255, 0.1)' : 'rgba(0,0,0,0.05)',
                        color: user.role === 'admin' ? 'var(--accent)' : 'inherit',
                        fontWeight: '600'
                        }}>
                        {user.role.toUpperCase()}
                        </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.9rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                        Aktif
                        </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-btn" title="Düzenle"><Shield size={16} /></button>
                        <button className="icon-btn" title="Pasif Yap" style={{ color: '#ef4444' }}><UserX size={16} /></button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </section>
        )}

        {activeTab === 'activity' && (
            <section className="activity-tracking" style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Son Öğrenci Denemeleri</h2>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                            <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Öğrenci</th>
                            <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Oyun/Seviye</th>
                            <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Skor</th>
                            <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Tarih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attempts.map(attempt => (
                            <tr key={attempt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '16px 20px', fontWeight: '600' }}>{attempt.full_name}</td>
                                <td style={{ padding: '16px 20px' }}>{attempt.level_title}</td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{attempt.score}</span>
                                </td>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{attempt.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        )}

        {activeTab === 'levels' && (
            <section className="level-review" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>BEKLEMEDE</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>#102</span>
                    </div>
                    <h3 style={{ margin: '0 0 8px 0' }}>Atomun Yapısı</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Oluşturan: Mehmet Demir</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}>
                            <CheckCircle size={14} style={{ marginRight: '4px' }} /> Onayla
                        </button>
                        <button className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}>İncele</button>
                    </div>
                </div>
            </section>
        )}
      </div>
    </MainLayout>
  );
};
