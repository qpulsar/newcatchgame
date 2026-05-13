import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { Bug, Plus, Trash2, X, Activity, Search, Play, Square } from 'lucide-react';

interface Asset {
    id: number;
    name: string;
    type: string;
    url: string;
    thumbnail_url?: string;
    creator_id: number;
    created_at: string;
}

export const AssetLibrary: React.FC = () => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetFormData, setAssetFormData] = useState({
    name: '',
    type: 'background',
    file: null as File | null
  });

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
      const response = await fetch('http://localhost:8000/assets');
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

    const token = localStorage.getItem('token');
    const data = new FormData();
    data.append('file', assetFormData.file);
    data.append('name', assetFormData.name);
    data.append('type', assetFormData.type);

    try {
      const response = await fetch('http://localhost:8000/assets/upload', {
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
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm('Bu varlığı silmek istediğinize emin misiniz?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/assets/${assetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div style={{ padding: '30px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Varlık Kütüphanesi</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Tüm oyunlar için ortak medya öğelerini buradan yönetin.</p>
          </div>
          <button 
              onClick={() => setIsAssetModalOpen(true)}
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
              <Plus size={20} /> Yeni Varlık Yükle
          </button>
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
                            <button 
                                onClick={() => handleDeleteAsset(asset.id)}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
                                title="Sil"
                            >
                                <Trash2 size={16} />
                            </button>
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
                    
                    <form onSubmit={handleAssetUpload}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Varlık Adı</label>
                            <input 
                                required
                                placeholder="Örn: Orman Arka Planı"
                                value={assetFormData.name}
                                onChange={e => setAssetFormData({...assetFormData, name: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} 
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Tür</label>
                            <select 
                                value={assetFormData.type}
                                onChange={e => setAssetFormData({...assetFormData, type: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
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
                                type="file"
                                onChange={e => setAssetFormData({...assetFormData, file: e.target.files ? e.target.files[0] : null})}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} 
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button type="button" onClick={() => setIsAssetModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', fontWeight: '600' }}>İptal</button>
                            <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Yükle</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </MainLayout>
  );
};
