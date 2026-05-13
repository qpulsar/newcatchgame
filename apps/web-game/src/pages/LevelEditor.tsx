import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { GameContainer } from '../components/game/GameContainer';
import type { LevelData, TargetData, ItemData } from '../game/types';
import { Save, Plus, Trash2, Settings as SettingsIcon, Layout, Database, Play, X } from 'lucide-react';

export const LevelEditor: React.FC = () => {
    const [level, setLevel] = useState<LevelData & { thumbnail_url?: string; game_type?: string }>({
        id: 'new-level',
        title: 'Yeni Oyun',
        description: 'Oyun açıklamasını buraya yazın.',
        thumbnail_url: '',
        game_type: 'catch',
        background: 'background',
        targets: [
            { category: 'Kategori 1', label: 'HEDEF 1', color: 0x6366f1, x: 256, y: 648, width: 200, height: 120 }
        ],
        items: [
            { text: 'Nesne 1', category: 'Kategori 1', weight: 1 }
        ],
        config: {
            spawnRate: 2000,
            gravityY: 300,
            playerSpeed: 600,
            winScore: 100
        }
    });

    const [activeTab, setActiveTab] = useState<'settings' | 'targets' | 'items'>('settings');
    const [isTesting, setIsTesting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const validateLevel = (): string[] => {
        const errors: string[] = [];
        if (!level.title.trim()) errors.push("Oyun adı boş olamaz.");
        if (level.targets.length === 0) errors.push("En az bir hedef (kategori) tanımlanmalıdır.");
        if (level.items.length === 0) errors.push("En az bir oyun nesnesi tanımlanmalıdır.");
        
        const targetCategories = new Set(level.targets.map(t => t.category));
        const itemCategories = new Set(level.items.map(i => i.category));
        
        const missingItems = Array.from(targetCategories).filter(cat => !itemCategories.has(cat));
        if (missingItems.length > 0) {
            errors.push(`Şu kategoriler için nesne tanımlanmamış: ${missingItems.join(", ")}`);
        }

        const unusedItems = Array.from(itemCategories).filter(cat => !targetCategories.has(cat));
        if (unusedItems.length > 0) {
            errors.push(`Şu kategoriler için hedef tanımlanmamış: ${unusedItems.join(", ")}`);
        }

        return errors;
    };

    const handleSave = async () => {
        const errors = validateLevel();
        if (errors.length > 0) {
            setValidationErrors(errors);
            alert("Lütfen hataları düzeltin:\n" + errors.join("\n"));
            return;
        }
        setValidationErrors([]);

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Lütfen önce giriş yapın.');
            return;
        }

        const levelPayload = {
            title: level.title,
            description: level.description,
            thumbnail_url: level.thumbnail_url,
            game_type: level.game_type,
            data: {
                background: level.background,
                targets: level.targets,
                items: level.items,
                config: level.config
            }
        };

        try {
            const response = await fetch('http://localhost:8000/levels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(levelPayload)
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Oyun başarıyla kaydedildi! ID: ${data.id}`);
            } else {
                const error = await response.json();
                alert(`Kaydetme hatası: ${error.detail || 'Bilinmeyen hata'}`);
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Sunucuya bağlanılamadı.');
        }
    };

    const addTarget = () => {
        const newTarget: TargetData = {
            category: 'Yeni Kategori',
            label: 'YENİ HEDEF',
            color: Math.floor(Math.random() * 16777215),
            x: 512,
            y: 648,
            width: 200,
            height: 120
        };
        setLevel({ ...level, targets: [...level.targets, newTarget] });
    };

    const addItem = () => {
        const newItem: ItemData = {
            text: 'Yeni Nesne',
            category: level.targets.length > 0 ? level.targets[0].category : 'Genel',
            weight: 1
        };
        setLevel({ ...level, items: [...level.items, newItem] });
    };

    return (
        <MainLayout>
            <div className="editor-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <header style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'var(--bg-surface)'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Oyun Tasarımcısı</h1>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{level.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => {
                                const errors = validateLevel();
                                if (errors.length > 0) {
                                    alert("Test etmeden önce hataları düzeltin:\n" + errors.join("\n"));
                                    return;
                                }
                                setIsTesting(true);
                            }}
                            className="btn-secondary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                        >
                            <Play size={18} /> Test Et
                        </button>
                        <button 
                            onClick={handleSave}
                            className="btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                        >
                            <Save size={18} /> Kaydet / Yayınla
                        </button>
                    </div>
                </header>

                <div className="editor-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Yan Menü (Tablar) */}
                    <aside style={{ 
                        width: '320px', 
                        borderRight: '1px solid var(--border-color)', 
                        background: 'var(--bg-surface)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                            <button 
                                onClick={() => setActiveTab('settings')}
                                style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'settings' ? 'rgba(0,0,0,0.05)' : 'transparent', borderBottom: activeTab === 'settings' ? '2px solid var(--primary-color)' : 'none' }}
                                title="Genel Ayarlar"
                            >
                                <SettingsIcon size={18} />
                            </button>
                            <button 
                                onClick={() => setActiveTab('targets')}
                                style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'targets' ? 'rgba(0,0,0,0.05)' : 'transparent', borderBottom: activeTab === 'targets' ? '2px solid var(--primary-color)' : 'none' }}
                                title="Hedef Kategoriler"
                            >
                                <Layout size={18} />
                            </button>
                            <button 
                                onClick={() => setActiveTab('items')}
                                style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'items' ? 'rgba(0,0,0,0.05)' : 'transparent', borderBottom: activeTab === 'items' ? '2px solid var(--primary-color)' : 'none' }}
                                title="Oyun Nesneleri"
                            >
                                <Database size={18} />
                            </button>
                        </div>

                        <div className="tab-content" style={{ padding: '20px', overflowY: 'auto' }}>
                            {activeTab === 'settings' && (
                                <div className="settings-form">
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Oyun Adı</label>
                                        <input 
                                            type="text" 
                                            value={level.title} 
                                            onChange={(e) => setLevel({ ...level, title: e.target.value })}
                                            placeholder="Örn: Elementleri Sınıflandır"
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Küçük Resim (Thumbnail) URL</label>
                                        <input 
                                            type="text" 
                                            value={level.thumbnail_url} 
                                            onChange={(e) => setLevel({ ...level, thumbnail_url: e.target.value })}
                                            placeholder="https://example.com/image.png"
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                        />
                                        {level.thumbnail_url && (
                                            <div style={{ marginTop: '8px', width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                <img src={level.thumbnail_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Açıklama</label>
                                        <textarea 
                                            value={level.description} 
                                            onChange={(e) => setLevel({ ...level, description: e.target.value })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '80px' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px' }}>Zorluk: Düşme Hızı (ms)</label>
                                        <input 
                                            type="number" 
                                            value={level.config.spawnRate} 
                                            onChange={(e) => setLevel({ ...level, config: { ...level.config, spawnRate: parseInt(e.target.value) } })}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'targets' && (
                                <div className="targets-list">
                                    <button onClick={addTarget} className="btn-secondary" style={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Plus size={16} /> Hedef Ekle
                                    </button>
                                    {level.targets.map((target, idx) => (
                                        <div key={idx} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '12px', position: 'relative', background: 'var(--bg-main)' }}>
                                            <button 
                                                onClick={() => setLevel({ ...level, targets: level.targets.filter((_, i) => i !== idx) })}
                                                style={{ position: 'absolute', right: '8px', top: '8px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <div style={{ marginBottom: '8px' }}>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Kategori</label>
                                                <input 
                                                    type="text" 
                                                    value={target.category} 
                                                    onChange={(e) => {
                                                        const newTargets = [...level.targets];
                                                        newTargets[idx].category = e.target.value;
                                                        setLevel({ ...level, targets: newTargets });
                                                    }}
                                                    style={{ width: '100%', border: 'none', background: 'transparent', borderBottom: '1px solid var(--border-color)', padding: '2px 0' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Etiket</label>
                                                <input 
                                                    type="text" 
                                                    value={target.label} 
                                                    onChange={(e) => {
                                                        const newTargets = [...level.targets];
                                                        newTargets[idx].label = e.target.value;
                                                        setLevel({ ...level, targets: newTargets });
                                                    }}
                                                    style={{ width: '100%', border: 'none', background: 'transparent', borderBottom: '1px solid var(--border-color)', padding: '2px 0' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'items' && (
                                <div className="items-list">
                                    <button onClick={addItem} className="btn-secondary" style={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Plus size={16} /> Nesne Ekle
                                    </button>
                                    {level.items.map((item, idx) => (
                                        <div key={idx} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', marginBottom: '4px', borderRadius: '4px' }}>
                                            <div style={{ flex: 1 }}>
                                                <input 
                                                    type="text" 
                                                    value={item.text} 
                                                    onChange={(e) => {
                                                        const newItems = [...level.items];
                                                        newItems[idx].text = e.target.value;
                                                        setLevel({ ...level, items: newItems });
                                                    }}
                                                    style={{ width: '100%', fontWeight: '600', border: 'none', background: 'transparent' }}
                                                />
                                                <select 
                                                    value={item.category} 
                                                    onChange={(e) => {
                                                        const newItems = [...level.items];
                                                        newItems[idx].category = e.target.value;
                                                        setLevel({ ...level, items: newItems });
                                                    }}
                                                    style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-secondary)', border: 'none', background: 'transparent' }}
                                                >
                                                    {Array.from(new Set(level.targets.map(t => t.category))).map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                    <option value="Diğer">Diğer</option>
                                                </select>
                                            </div>
                                            <button 
                                                onClick={() => setLevel({ ...level, items: level.items.filter((_, i) => i !== idx) })}
                                                style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Önizleme Alanı */}
                    <main style={{ flex: 1, background: 'var(--bg-main)', padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        <div style={{ 
                            width: '800px', 
                            height: '500px', 
                            background: '#028af8', 
                            borderRadius: '12px', 
                            position: 'relative',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                            backgroundImage: 'radial-gradient(circle at center, #0ea5e9 0%, #028af8 100%)'
                        }}>
                            <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'white' }}>
                                <h3 style={{ margin: 0, opacity: 0.8 }}>Önizleme</h3>
                            </div>
                            
                            {/* Hedef Kutu Önizlemeleri */}
                            <div style={{ position: 'absolute', bottom: '20px', width: '100%', display: 'flex', justifyContent: 'center', gap: '20px', padding: '0 40px' }}>
                                {level.targets.map((t, idx) => (
                                    <div key={idx} style={{ 
                                        width: '140px',
                                        height: '80px',
                                        background: 'rgba(255,255,255,0.15)',
                                        border: '2px dashed rgba(255,255,255,0.5)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        textAlign: 'center',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{t.category}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>{t.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Düşen Nesne Örnekleri */}
                            <div style={{ position: 'absolute', top: '100px', width: '100%', display: 'flex', justifyContent: 'space-around' }}>
                                {level.items.slice(0, 3).map((item, idx) => (
                                    <div key={idx} style={{ 
                                        padding: '10px 20px', 
                                        background: 'white', 
                                        borderRadius: '20px', 
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: '#334155',
                                        transform: `rotate(${idx * 5 - 5}deg)`
                                    }}>
                                        {item.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>

                {/* Test Modalı */}
                {isTesting && (
                    <div style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        background: 'rgba(0,0,0,0.85)', 
                        zIndex: 1000, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ width: '1024px', position: 'relative' }}>
                            <button 
                                onClick={() => setIsTesting(false)}
                                style={{ 
                                    position: 'absolute', 
                                    top: '-40px', 
                                    right: 0, 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'white', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <X size={24} /> Kapat
                            </button>
                            <GameContainer levelData={level} />
                            <div style={{ color: 'white', marginTop: '16px', textAlign: 'center' }}>
                                <p>Test Modu: ESC tuşuna basarak veya yukarıdaki Kapat butonuyla çıkabilirsiniz.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
