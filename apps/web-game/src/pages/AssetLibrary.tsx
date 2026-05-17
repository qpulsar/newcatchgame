import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { Bug, Plus, Trash2, X, Activity, Search, Play, Square, Loader2, Upload, FileUp, Grid, Image, Music, Type, Sparkles, Boxes } from 'lucide-react';

interface Asset {
    id: number;
    name: string;
    type: string;
    url: string;
    thumbnail_url?: string;
    creator_id: number;
    creator_role?: string;
    created_at: string;
}

export const AssetLibrary: React.FC = () => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const userStr = localStorage.getItem('user');
  const [user, setUser] = useState<any>((userStr && userStr !== 'undefined') ? JSON.parse(userStr) : {});

  useEffect(() => {
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

  const canDeleteAsset = (asset: Asset) => {
    if (!user || !user.role) return false;
    
    // Admin her şeyi silebilir
    if (user.role === 'admin') return true;
    
    // Adminin eklediği asset'leri öğretmen ve öğrenci silememeli.
    if (asset.creator_role === 'admin') return false;
    
    // Öğrenci öğretmeninin eklediği assetleri silememeli ve sadece kendi eklediklerini silebilmeli.
    if (user.role === 'student') {
      return asset.creator_id === user.id;
    }
    
    // Öğretmen sadece kendi eklediklerini silebilmeli.
    if (user.role === 'teacher') {
      return asset.creator_id === user.id;
    }
    
    return false;
  };
  
  // Modal states
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetFormData, setAssetFormData] = useState({
    name: '',
    type: 'background',
    file: null as File | null
  });

  // Bulk upload states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkType, setBulkType] = useState('auto');
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Tab states
  const [activeTab, setActiveTab] = useState<string>('all');

  const [playingAssetId, setPlayingAssetId] = useState<number | null>(null);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  const toggleAudio = (asset: Asset) => {
    if (playingAssetId === asset.id) {
      audioInstance?.pause();
      setPlayingAssetId(null);
      setAudioInstance(null);
    } else {
      // Stop current if playing
      if (audioInstance) {
        audioInstance.pause();
      }
      
      const newAudio = new Audio(asset.url);
      newAudio.play();
      newAudio.onended = () => {
        setPlayingAssetId(null);
        setAudioInstance(null);
      };
      setAudioInstance(newAudio);
      setPlayingAssetId(asset.id);
    }
  };

  useEffect(() => {
    return () => {
      if (audioInstance) {
        audioInstance.pause();
      }
    };
  }, [audioInstance]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/assets`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAssetUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetFormData.file) return;

    setIsUploading(true);
    const token = localStorage.getItem('token');
    const data = new FormData();
    data.append('file', assetFormData.file);
    data.append('name', assetFormData.name);
    data.append('type', assetFormData.type);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/assets/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (response.ok) {
        setIsAssetModalOpen(false);
        setAssetFormData({ name: '', type: 'background', file: null });
        fetchAssets();
      }
    } catch (err) {
      console.error('Error uploading asset:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setBulkFiles(prev => [...prev, ...selected]);
    }
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getAutoDetectedType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'background';
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext)) return 'sound';
    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'font';
    return 'background';
  };

  const handleBulkAssetUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkFiles.length === 0) return;

    setIsBulkUploading(true);
    const token = localStorage.getItem('token');
    const data = new FormData();
    
    bulkFiles.forEach(file => {
      data.append('files', file);
    });
    data.append('type', bulkType);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/assets/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (response.ok) {
        setIsBulkModalOpen(false);
        setBulkFiles([]);
        setBulkType('auto');
        fetchAssets();
      } else {
        const errData = await response.json();
        alert(errData.detail || 'Toplu yükleme sırasında bir hata oluştu.');
      }
    } catch (err) {
      console.error('Error in bulk uploading:', err);
      alert('Toplu yükleme sırasında teknik bir hata oluştu.');
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm('Bu varlığı silmek istediğinize emin misiniz?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/assets/${assetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const getAssetCount = (tabType: string) => {
    if (tabType === 'all') return assets.length;
    if (tabType === 'background') return assets.filter(a => a.type === 'background').length;
    if (tabType === 'audio') return assets.filter(a => a.type === 'sound' || a.type === 'music').length;
    if (tabType === 'font') return assets.filter(a => a.type === 'font').length;
    if (tabType === 'spritesheet') return assets.filter(a => a.type === 'spritesheet').length;
    if (tabType === 'effect') return assets.filter(a => a.type === 'effect').length;
    return 0;
  };

  const tabs = [
    { id: 'all', label: 'Tümü', icon: <Grid size={16} /> },
    { id: 'background', label: 'Arka Planlar', icon: <Image size={16} /> },
    { id: 'audio', label: 'Ses & Müzik', icon: <Music size={16} /> },
    { id: 'font', label: 'Yazı Tipleri', icon: <Type size={16} /> },
    { id: 'spritesheet', label: 'Sprite Sheet', icon: <Boxes size={16} /> },
    { id: 'effect', label: 'Efektler', icon: <Sparkles size={16} /> },
  ];

  const filteredAssets = assets.filter(asset => {
    // Arama terimi eşleşmesi
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.type.toLowerCase().includes(searchTerm.toLowerCase());
                          
    if (!matchesSearch) return false;
    
    // Tab eşleşmesi
    if (activeTab === 'all') return true;
    if (activeTab === 'background') return asset.type === 'background';
    if (activeTab === 'audio') return asset.type === 'sound' || asset.type === 'music';
    if (activeTab === 'font') return asset.type === 'font';
    if (activeTab === 'spritesheet') return asset.type === 'spritesheet';
    if (activeTab === 'effect') return asset.type === 'effect';
    
    return true;
  });

  return (
    <MainLayout>
      <div style={{ padding: '30px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Varlık Kütüphanesi</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Tüm oyunlar için ortak medya öğelerini buradan yönetin.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                  onClick={() => setIsAssetModalOpen(true)}
                  style={{ 
                      background: 'var(--bg-surface)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border-color)', 
                      padding: '10px 20px', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
              >
                  <Plus size={20} /> Tekli Yükle
              </button>
              {user.role === 'admin' && (
                  <button 
                      onClick={() => setIsBulkModalOpen(true)}
                      style={{ 
                          background: 'var(--primary-color)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '10px 20px', 
                          borderRadius: '8px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                  >
                      <FileUp size={20} /> Toplu Varlık Yükle
                  </button>
              )}
          </div>
        </header>

        <div style={{ marginBottom: '24px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
                type="text" 
                placeholder="Varlık adı veya türü ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                    width: '100%',
                    padding: '12px 16px 12px 48px', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem'
                }}
            />
        </div>

        {/* Tabs Navigation */}
        <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '30px', 
            overflowX: 'auto', 
            paddingBottom: '8px',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE
        }} className="tabs-container">
            <style>{`
                .tabs-container::-webkit-scrollbar {
                    display: none; /* Safari and Chrome */
                }
                .tab-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    background: var(--bg-surface);
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                }
                .tab-button:hover {
                    color: var(--text-primary);
                    border-color: var(--text-secondary);
                    transform: translateY(-1px);
                }
                .tab-button.active {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: white;
                    box-shadow: 0 4px 12px rgba(var(--primary-rgb, 99, 102, 241), 0.25);
                }
                .tab-badge {
                    font-size: 0.75rem;
                    padding: 2px 6px;
                    border-radius: 10px;
                    background: rgba(0,0,0,0.06);
                    color: var(--text-secondary);
                    transition: all 0.2s;
                }
                .tab-button.active .tab-badge {
                    background: rgba(255,255,255,0.2);
                    color: white;
                }
            `}</style>
            {tabs.map(tab => {
                const count = getAssetCount(tab.id);
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        <span className="tab-badge">{count}</span>
                    </button>
                );
            })}
        </div>

        {isLoading ? (
            <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-secondary)' }}>Yükleniyor...</div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                {filteredAssets.map(asset => (
                    <div key={asset.id} style={{ 
                        background: 'var(--bg-surface)', 
                        borderRadius: '16px', 
                        border: '1px solid var(--border-color)', 
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s',
                        cursor: 'default'
                    }} className="asset-card">
                        <div style={{ height: '140px', background: 'rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                            {asset.type === 'background' || asset.type === 'spritesheet' ? (
                                <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', padding: '0 10px' }}>
                                    {asset.type === 'music' ? <Activity size={48} /> : 
                                     asset.type === 'font' ? (
                                        <div style={{ textAlign: 'center', width: '100%' }}>
                                            <style>{`
                                                @font-face {
                                                    font-family: 'font-${asset.id}';
                                                    src: url('${asset.url}');
                                                }
                                            `}</style>
                                            <div style={{ 
                                                fontFamily: `'font-${asset.id}', sans-serif`, 
                                                fontSize: '2rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                EduGame
                                            </div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Abc 123</div>
                                        </div>
                                     ) : <Bug size={48} />}
                                    
                                    {(asset.type === 'music' || asset.type === 'sound') && (
                                        <button 
                                            onClick={() => toggleAudio(asset)}
                                            style={{ 
                                                background: 'var(--primary-color)', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '50%', 
                                                width: '40px', 
                                                height: '40px', 
                                                display: 'flex', 
                                                justifyContent: 'center', 
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {playingAssetId === asset.id ? <Square size={20} fill="white" /> : <Play size={20} fill="white" />}
                                        </button>
                                    )}
                                </div>
                            )}
                            {canDeleteAsset(asset) && (
                                <button 
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                                    title="Sil"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <div style={{ padding: '16px' }}>
                            <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ 
                                    fontSize: '0.7rem', 
                                    color: 'var(--primary-color)', 
                                    textTransform: 'uppercase', 
                                    fontWeight: 'bold',
                                    background: 'rgba(var(--primary-rgb), 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}>
                                    {asset.type}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    {new Date(asset.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Asset Upload Modal */}
        {isAssetModalOpen && (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: 'var(--bg-surface)',
                    padding: '30px',
                    borderRadius: '20px',
                    width: '450px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Yeni Varlık Yükle</h3>
                        <button onClick={() => setIsAssetModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
                    </div>
                    
                    <form onSubmit={handleAssetUpload} style={{ position: 'relative' }}>
                        {isUploading && (
                            <div className="loading-overlay">
                                <Loader2 size={40} className="animate-spin" />
                                <div className="loading-text">Dosya Yükleniyor...</div>
                            </div>
                        )}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Varlık Adı</label>
                            <input 
                                required
                                disabled={isUploading}
                                placeholder="Örn: Orman Arka Planı"
                                value={assetFormData.name}
                                onChange={e => setAssetFormData({...assetFormData, name: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', opacity: isUploading ? 0.6 : 1 }} 
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Tür</label>
                            <select 
                                disabled={isUploading}
                                value={assetFormData.type}
                                onChange={e => setAssetFormData({...assetFormData, type: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', opacity: isUploading ? 0.6 : 1 }}
                            >
                                <option value="background">Arka Plan Görseli</option>
                                <option value="music">Arka Plan Müziği</option>
                                <option value="sound">Ses Efekti</option>
                                <option value="font">Yazı Tipi (Font)</option>
                                <option value="spritesheet">Sprite Sheet (PNG)</option>
                                <option value="effect">Görsel Efekt (JSON/Atlas)</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Dosya</label>
                            <input 
                                required
                                disabled={isUploading}
                                type="file"
                                onChange={e => setAssetFormData({...assetFormData, file: e.target.files ? e.target.files[0] : null})}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', opacity: isUploading ? 0.6 : 1 }} 
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button type="button" disabled={isUploading} onClick={() => setIsAssetModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'none', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isUploading ? 0.5 : 1 }}>İptal</button>
                            <button type="submit" disabled={isUploading} style={{ 
                                flex: 2, 
                                padding: '12px', 
                                borderRadius: '10px', 
                                border: 'none', 
                                background: 'var(--primary-color)', 
                                color: 'white', 
                                cursor: isUploading ? 'not-allowed' : 'pointer', 
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                {isUploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : 'Yükle'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {/* Bulk Asset Upload Modal */}
        {isBulkModalOpen && (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    background: 'var(--bg-surface)',
                    padding: '30px',
                    borderRadius: '20px',
                    width: '550px',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Toplu Varlık Yükle (Yönetici)</h3>
                        <button onClick={() => setIsBulkModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
                    </div>
                    
                    <form onSubmit={handleBulkAssetUpload} style={{ position: 'relative' }}>
                        {isBulkUploading && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.7)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '12px',
                                zIndex: 10
                            }}>
                                <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Varlıklar Yükleniyor...</div>
                            </div>
                        )}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Varlık Türü</label>
                            <select 
                                disabled={isBulkUploading}
                                value={bulkType}
                                onChange={e => setBulkType(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', opacity: isBulkUploading ? 0.6 : 1 }}
                            >
                                <option value="auto">Uzantıya Göre Otomatik Tespit Et</option>
                                <option value="background">Arka Plan Görseli</option>
                                <option value="music">Arka Plan Müziği</option>
                                <option value="sound">Ses Efekti</option>
                                <option value="font">Yazı Tipi (Font)</option>
                                <option value="spritesheet">Sprite Sheet (PNG)</option>
                                <option value="effect">Görsel Efekt (JSON/Atlas)</option>
                            </select>
                        </div>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Dosyaları Seçin</label>
                            <div 
                                style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '30px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: 'rgba(0,0,0,0.02)',
                                    transition: 'border-color 0.2s',
                                    position: 'relative'
                                }}
                                onClick={() => document.getElementById('bulk-file-input')?.click()}
                            >
                                <Upload size={36} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }} />
                                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>Tıklayarak birden fazla dosya seçin</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>PNG, JPG, MP3, WAV, TTF vb. formatlar</div>
                                <input 
                                    id="bulk-file-input"
                                    type="file"
                                    multiple
                                    onChange={handleBulkFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        {bulkFiles.length > 0 && (
                            <div style={{ marginBottom: '30px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Seçilen Dosyalar ({bulkFiles.length})</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setBulkFiles([])}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
                                    >
                                        Tümünü Temizle
                                    </button>
                                </div>
                                <div style={{ 
                                    border: '1px solid var(--border-color)', 
                                    borderRadius: '8px', 
                                    maxHeight: '180px', 
                                    overflowY: 'auto',
                                    background: 'var(--bg-input)'
                                }}>
                                    {bulkFiles.map((file, idx) => (
                                        <div key={idx} style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            padding: '10px 12px',
                                            borderBottom: idx < bulkFiles.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            fontSize: '0.85rem'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                                                <span style={{ fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {(file.size / 1024).toFixed(1)} KB • {bulkType === 'auto' ? `Otomatik: ${getAutoDetectedType(file.name)}` : bulkType}
                                                </span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => removeBulkFile(idx)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button type="button" disabled={isBulkUploading} onClick={() => setIsBulkModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'none', cursor: isBulkUploading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isBulkUploading ? 0.5 : 1 }}>İptal</button>
                            <button type="submit" disabled={isBulkUploading || bulkFiles.length === 0} style={{ 
                                flex: 2, 
                                padding: '12px', 
                                borderRadius: '10px', 
                                border: 'none', 
                                background: bulkFiles.length === 0 ? 'var(--border-color)' : 'var(--primary-color)', 
                                color: 'white', 
                                cursor: (isBulkUploading || bulkFiles.length === 0) ? 'not-allowed' : 'pointer', 
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                {isBulkUploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : 'Tümünü Yükle'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </MainLayout>
  );
};
