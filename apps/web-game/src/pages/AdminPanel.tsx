import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { Users, Shield, UserCheck, UserX, Search, Activity, BookOpen, CheckCircle, Plus, Edit2, Trash2, X } from 'lucide-react';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export const AdminPanel: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'levels'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'student'
  });

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        full_name: user.full_name,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        full_name: '',
        password: '',
        role: 'student'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = editingUser 
      ? `http://localhost:8000/users/${editingUser.id}` 
      : 'http://localhost:8000/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.detail || 'İşlem başarısız oldu');
      }
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="admin-content" style={{ padding: '24px' }}>
        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Yönetici Paneli</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Sistem kullanıcılarını ve içeriklerini yönetin.</p>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button 
                onClick={() => setActiveTab('users')}
                className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
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
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Kullanıcı Listesi</h2>
                    <button 
                        onClick={() => handleOpenModal()}
                        style={{ 
                            background: 'var(--primary-color)', 
                            color: 'white', 
                            border: 'none', 
                            padding: '6px 12px', 
                            borderRadius: '6px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={16} /> Yeni Kullanıcı
                    </button>
                </div>
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

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                        <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Kullanıcı</th>
                        <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>Rol</th>
                        <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-secondary)' }}>İşlemler</th>
                    </tr>
                    </thead>
                    <tbody>
                    {isLoading ? (
                        <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</td></tr>
                    ) : filteredUsers.map(user => (
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
                            background: user.role === 'admin' ? 'rgba(170, 59, 255, 0.1)' : (user.role === 'teacher' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.05)'),
                            color: user.role === 'admin' ? 'var(--accent)' : (user.role === 'teacher' ? '#3b82f6' : 'inherit'),
                            fontWeight: '600'
                            }}>
                            {user.role.toUpperCase()}
                            </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="icon-btn" onClick={() => handleOpenModal(user)} title="Düzenle"><Edit2 size={16} /></button>
                            <button className="icon-btn" onClick={() => handleDelete(user.id)} title="Sil" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            </section>
        )}

        {activeTab === 'activity' && (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px' }}>
                <p>Öğrenci takip özellikleri yakında eklenecek.</p>
            </div>
        )}

        {activeTab === 'levels' && (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '12px' }}>
                <p>Oyun inceleme paneli yakında eklenecek.</p>
            </div>
        )}

        {/* Modal */}
        {isModalOpen && (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: 'var(--bg-surface)',
                    padding: '24px',
                    borderRadius: '12px',
                    width: '400px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>{editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Oluştur'}</h3>
                        <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Tam Ad</label>
                            <input 
                                required
                                value={formData.full_name}
                                onChange={e => setFormData({...formData, full_name: e.target.value})}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} 
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>E-posta</label>
                            <input 
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} 
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Şifre {editingUser && '(Değiştirmek istemiyorsanız boş bırakın)'}</label>
                            <input 
                                required={!editingUser}
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} 
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Rol</label>
                            <select 
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                            >
                                <option value="student">Öğrenci</option>
                                <option value="teacher">Öğretmen</option>
                                <option value="admin">Yönetici</option>
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer' }}>İptal</button>
                            <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>Kaydet</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </MainLayout>
  );
};
