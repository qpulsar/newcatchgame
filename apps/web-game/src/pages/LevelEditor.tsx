import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { GameContainer } from '../components/game/GameContainer';
import type { GameProject, LevelData, ConceptData, TargetData } from '../game/types';
import { 
    Save, Plus, Trash2, Settings as SettingsIcon, Layout, Database, 
    Play, X, ChevronRight, Copy, ArrowUp, ArrowDown, Info, 
    Palette, Music, Zap, BarChart2, Globe, Monitor
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

type EditorTab = 'general' | 'levels' | 'concepts' | 'screens' | 'visual' | 'audio' | 'gameplay' | 'scoring' | 'publishing';
type EditorPhase = 'basics' | 'content' | 'design' | 'rules';

// --- Helper Functions ---
function createDefaultLevel(title: string): LevelData {
    return {
        id: crypto.randomUUID(),
        title,
        instruction: 'Doğru nesneleri yakala!',
        learning_goal: '',
        background: 'background',
        targets: [
            { category: 'A', label: 'HEDEF A', color: 0x6366f1, x: 256, y: 648, width: 200, height: 120 },
            { category: 'B', label: 'HEDEF B', color: 0xec4899, x: 768, y: 648, width: 200, height: 120 }
        ],
        correct_concepts: [{ text: 'Doğru 1', category: 'A', weight: 1 }],
        wrong_concepts: [{ text: 'Yanlış 1', category: 'B', weight: 1 }],
        duration: 60,
        target_score: 50,
        success_percentage: 70,
        config: {
            spawnRate: 2000,
            gravityY: 300,
            playerSpeed: 600,
            itemSpeed: 200
        },
        screens: {
            cover: { title: 'Hazır mısın?', description: 'Tüm doğru nesneleri yakalayarak puan kazan!', buttonText: 'Oyunu Başlat' },
            victory: { title: 'Harika!', description: 'Seviyeyi başarıyla tamamladın.', buttonText: 'Sıradaki Seviye' },
            defeat: { title: 'Olamaz!', description: 'Skorun yetersiz kaldı. Tekrar denemek ister misin?', buttonText: 'Tekrar Dene' },
            infoStart: { title: 'Bilgi', description: 'Bu seviyede fiziksel büyüklükleri öğreneceğiz.', buttonText: 'Anladım', enabled: false },
            infoEnd: { title: 'Özet', description: 'Harika iş çıkardın! Temel büyüklükleri kavradın.', buttonText: 'Devam Et', enabled: false }
        }
    } as any;
}

export const LevelEditor: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Initial project state from navigation state if available
    const [project, setProject] = useState<GameProject>(() => {
        if (location.state?.projectToLoad) {
            return location.state.projectToLoad;
        }
        return {
            title: 'Yeni Oyun Projesi',
            description: 'Oyun açıklamasını buraya yazın.',
            game_type: 'catch',
            language: 'tr',
            visibility: 'public',
            status: 'draft',
            data: {
                levels: [createDefaultLevel('Seviye 1')],
                settings: { showLeaderboard: true, allowRetries: true }
            }
        };
    });

    useEffect(() => {
        if (location.state?.projectToLoad) {
            // Clear navigation state to prevent re-loading on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const [activeTab, setActiveTab] = useState<EditorTab>('general');
    const [activePhase, setActivePhase] = useState<EditorPhase>('basics');
    const [activeScreen, setActiveScreen] = useState<'cover' | 'victory' | 'defeat' | 'infoStart' | 'infoEnd'>('cover');
    const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
    const [isTesting, setIsTesting] = useState(false);
    const [showSummary, setShowSummary] = useState(true);
    const [testMode, setTestMode] = useState<'single' | 'all'>('single');
    const [conceptSearch, setConceptSearch] = useState('');
    const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
    
    const currentLevel = project.data.levels[selectedLevelIndex] || project.data.levels[0];

    // --- Fetch Assets ---
    useEffect(() => {
        fetch('http://localhost:8000/assets')
            .then(res => res.json())
            .then(data => setLibraryAssets(data))
            .catch(err => console.error('Error fetching assets:', err));
    }, []);

    // --- Asset Picker Component ---
    const AssetPicker = ({ type, value, onChange, label }: { type: string, value: string, onChange: (val: string) => void, label: string }) => {
        const filtered = libraryAssets.filter(a => a.type === type);
        
        return (
            <div className="asset-picker-field" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>{label}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                        value={filtered.some(a => a.url === value) ? value : 'custom'} 
                        onChange={(e) => {
                            if (e.target.value !== 'custom') onChange(e.target.value);
                        }}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    >
                        <option value="custom">Özel URL veya Sabit...</option>
                        {filtered.map(a => (
                            <option key={a.id} value={a.url}>{a.name}</option>
                        ))}
                    </select>
                    {(!filtered.some(a => a.url === value) || value === '') && (
                        <input 
                            placeholder="URL girin..."
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                    )}
                </div>
            </div>
        );
    };

    // --- Auto Draft ---
    useEffect(() => {
        const draft = localStorage.getItem('editor_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                // setProject(parsed); // Don't overwrite immediately, maybe ask user
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('editor_draft', JSON.stringify(project));
    }, [project]);



    const addLevel = () => {
        const newList = [...project.data.levels, createDefaultLevel(`Seviye ${project.data.levels.length + 1}`)];
        setProject({ ...project, data: { ...project.data, levels: newList } });
        setSelectedLevelIndex(newList.length - 1);
    };

    const deleteLevel = (index: number) => {
        if (project.data.levels.length <= 1) return;
        const newList = project.data.levels.filter((_, i) => i !== index);
        setProject({ ...project, data: { ...project.data, levels: newList } });
        if (selectedLevelIndex >= newList.length) setSelectedLevelIndex(newList.length - 1);
    };

    const duplicateLevel = (index: number) => {
        const levelToCopy = project.data.levels[index];
        const newLevel = { ...JSON.parse(JSON.stringify(levelToCopy)), id: crypto.randomUUID(), title: `${levelToCopy.title} (Kopya)` };
        const newList = [...project.data.levels];
        newList.splice(index + 1, 0, newLevel);
        setProject({ ...project, data: { ...project.data, levels: newList } });
    };

    const updateCurrentLevel = (updates: Partial<LevelData>) => {
        const newList = [...project.data.levels];
        newList[selectedLevelIndex] = { ...newList[selectedLevelIndex], ...updates };
        setProject({ ...project, data: { ...project.data, levels: newList } });
    };

    const applyPhysicalQuantitiesTemplate = () => {
        const levels: LevelData[] = [
            {
                id: crypto.randomUUID(),
                title: 'Temel Büyüklükler',
                instruction: 'Yalnızca temel büyüklükleri yakala!',
                background: 'background',
                correct_concepts: [
                    { text: 'Uzunluk', category: 'Temel', weight: 1 },
                    { text: 'Kütle', category: 'Temel', weight: 1 },
                    { text: 'Zaman', category: 'Temel', weight: 1 },
                    { text: 'Sıcaklık', category: 'Temel', weight: 1 },
                    { text: 'Işık Şiddeti', category: 'Temel', weight: 1 },
                    { text: 'Akım Şiddeti', category: 'Temel', weight: 1 },
                    { text: 'Madde Miktarı', category: 'Temel', weight: 1 },
                ],
                wrong_concepts: [
                    { text: 'Hız', category: 'Türetilmiş', weight: 1 },
                    { text: 'Kuvvet', category: 'Türetilmiş', weight: 1 },
                    { text: 'Enerji', category: 'Türetilmiş', weight: 1 },
                    { text: 'İvme', category: 'Türetilmiş', weight: 1 },
                ],
                duration: 60, target_score: 50, success_percentage: 70,
                config: { spawnRate: 1500, gravityY: 300, playerSpeed: 600, itemSpeed: 200 }
            },
            {
                id: crypto.randomUUID(),
                title: 'Türetilmiş Büyüklükler',
                instruction: 'Yalnızca türetilmiş büyüklükleri yakala!',
                background: 'background',
                correct_concepts: [
                    { text: 'Hız', category: 'Türetilmiş', weight: 1 },
                    { text: 'İvme', category: 'Türetilmiş', weight: 1 },
                    { text: 'Kuvvet', category: 'Türetilmiş', weight: 1 },
                    { text: 'Enerji', category: 'Türetilmiş', weight: 1 },
                    { text: 'Basınç', category: 'Türetilmiş', weight: 1 },
                    { text: 'Güç', category: 'Türetilmiş', weight: 1 },
                ],
                wrong_concepts: [
                    { text: 'Uzunluk', category: 'Temel', weight: 1 },
                    { text: 'Zaman', category: 'Temel', weight: 1 },
                    { text: 'Kütle', category: 'Temel', weight: 1 },
                ],
                duration: 60, target_score: 60, success_percentage: 70,
                config: { spawnRate: 1400, gravityY: 350, playerSpeed: 600, itemSpeed: 220 }
            },
            {
                id: crypto.randomUUID(),
                title: 'Skaler Büyüklükler',
                instruction: 'Yalnızca skaler (yönsüz) büyüklükleri yakala!',
                background: 'background',
                correct_concepts: [
                    { text: 'Sürat', category: 'Skaler', weight: 1 },
                    { text: 'Sıcaklık', category: 'Skaler', weight: 1 },
                    { text: 'Enerji', category: 'Skaler', weight: 1 },
                    { text: 'Hacim', category: 'Skaler', weight: 1 },
                    { text: 'Kütle', category: 'Skaler', weight: 1 },
                    { text: 'Özkütle', category: 'Skaler', weight: 1 },
                ],
                wrong_concepts: [
                    { text: 'Hız', category: 'Vektörel', weight: 1 },
                    { text: 'Kuvvet', category: 'Vektörel', weight: 1 },
                    { text: 'İvme', category: 'Vektörel', weight: 1 },
                ],
                duration: 60, target_score: 60, success_percentage: 70,
                config: { spawnRate: 1300, gravityY: 400, playerSpeed: 600, itemSpeed: 240 }
            },
            {
                id: crypto.randomUUID(),
                title: 'Vektörel Büyüklükler',
                instruction: 'Yalnızca vektörel (yönlü) büyüklükleri yakala!',
                background: 'background',
                correct_concepts: [
                    { text: 'Hız', category: 'Vektörel', weight: 1 },
                    { text: 'Kuvvet', category: 'Vektörel', weight: 1 },
                    { text: 'İvme', category: 'Vektörel', weight: 1 },
                    { text: 'Ağırlık', category: 'Vektörel', weight: 1 },
                    { text: 'Yer Değiştirme', category: 'Vektörel', weight: 1 },
                    { text: 'Momentum', category: 'Vektörel', weight: 1 },
                ],
                wrong_concepts: [
                    { text: 'Sürat', category: 'Skaler', weight: 1 },
                    { text: 'Zaman', category: 'Skaler', weight: 1 },
                    { text: 'Kütle', category: 'Skaler', weight: 1 },
                ],
                duration: 60, target_score: 70, success_percentage: 70,
                config: { spawnRate: 1200, gravityY: 450, playerSpeed: 600, itemSpeed: 260 }
            }
        ];
        
        setProject({
            ...project,
            title: 'Fiziksel Büyüklükler',
            description: 'Fiziksel büyüklüklerin sınıflandırıldığı 4 seviyeli eğitsel oyun.',
            data: { ...project.data, levels }
        });
        setSelectedLevelIndex(0);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Lütfen önce giriş yapın.');
            return;
        }

        try {
            const method = project.id ? 'PUT' : 'POST';
            const url = project.id ? `http://localhost:8000/levels/${project.id}` : 'http://localhost:8000/levels';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(project)
            });

            if (response.ok) {
                const data = await response.json();
                setProject({ ...project, id: data.id });
                alert('Oyun başarıyla kaydedildi!');
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                alert('Oturum süreniz doldu, lütfen tekrar giriş yapın.');
                navigate('/login');
            } else {
                const err = await response.json();
                alert(`Hata: ${err.detail}`);
            }
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    // --- Render Helpers ---
    const renderTabButton = (id: EditorTab, label: string, icon: React.ReactNode) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`editor-tab-btn ${activeTab === id ? 'active' : ''}`}
        >
            <div className="icon-wrapper">{icon}</div>
            <span>{label}</span>
        </button>
    );

    const renderPhaseButton = (id: EditorPhase, label: string) => (
        <button 
            onClick={() => {
                setActivePhase(id);
                // Set first tab of phase as active
                if (id === 'basics') setActiveTab('general');
                if (id === 'content') setActiveTab('concepts');
                if (id === 'design') setActiveTab('visual');
                if (id === 'rules') setActiveTab('gameplay');
            }}
            className={`phase-btn ${activePhase === id ? 'active' : ''}`}
        >
            {label}
        </button>
    );

    return (
        <MainLayout>
            <div className="editor-container">
                {/* Slim Header Area */}
                <header className="editor-header">
                    <div className="header-left">
                        <div className="project-meta">
                            <span className="status-badge">{project.status.toUpperCase()}</span>
                            <h1 title={project.title}>{project.title}</h1>
                        </div>
                        <div className="phase-nav">
                            {renderPhaseButton('basics', 'Temeller')}
                            {renderPhaseButton('content', 'İçerik')}
                            {renderPhaseButton('design', 'Tasarım')}
                            {renderPhaseButton('rules', 'Ayarlar')}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button 
                            className={`btn-icon ${showSummary ? 'active' : ''}`} 
                            onClick={() => setShowSummary(!showSummary)}
                            title="Özeti Göster/Gizle"
                        >
                            <BarChart2 size={18} />
                        </button>
                        <button className="btn-test" onClick={() => { setTestMode('all'); setIsTesting(true); }}>
                            <Play size={16} /> Önizle
                        </button>
                        <button className="btn-save" onClick={handleSave}>
                            <Save size={16} /> Kaydet
                        </button>
                        <button className="btn-exit" onClick={() => navigate('/play')}>
                            <X size={16} />
                        </button>
                    </div>
                </header>

                <div className="editor-main-layout">
                    {/* SLIM LEFT PANEL: Settings & Tabs */}
                    <aside className="editor-left-panel">
                        <nav className="editor-tabs">
                            {activePhase === 'basics' && (
                                <>
                                    {renderTabButton('general', 'Genel', <Globe size={18} />)}
                                    {renderTabButton('levels', 'Seviyeler', <Layout size={18} />)}
                                </>
                            )}
                            {activePhase === 'content' && (
                                <>
                                    {renderTabButton('concepts', 'Kavramlar', <Database size={18} />)}
                                    {renderTabButton('screens', 'Ekranlar', <Monitor size={18} />)}
                                </>
                            )}
                            {activePhase === 'design' && (
                                <>
                                    {renderTabButton('visual', 'Görsel', <Palette size={18} />)}
                                    {renderTabButton('audio', 'Ses', <Music size={18} />)}
                                </>
                            )}
                            {activePhase === 'rules' && (
                                <>
                                    {renderTabButton('gameplay', 'Oynanış', <Zap size={18} />)}
                                    {renderTabButton('scoring', 'Puanlama', <BarChart2 size={18} />)}
                                    {renderTabButton('publishing', 'Yayınla', <Globe size={18} />)}
                                </>
                            )}
                        </nav>

                        <div className="tab-content">
                            {activeTab === 'general' && (
                                <div className="settings-group">
                                    <h3>Proje Bilgileri</h3>
                                    <label>Oyun Başlığı</label>
                                    <input value={project.title} onChange={e => setProject({...project, title: e.target.value})} />
                                    
                                    <label>Açıklama</label>
                                    <textarea value={project.description} onChange={e => setProject({...project, description: e.target.value})} />
                                    
                                    <div className="grid-2">
                                        <div>
                                            <label>Ders</label>
                                            <input value={project.course || ''} onChange={e => setProject({...project, course: e.target.value})} />
                                        </div>
                                        <div>
                                            <label>Sınıf</label>
                                            <input value={project.grade_level || ''} onChange={e => setProject({...project, grade_level: e.target.value})} />
                                        </div>
                                    </div>
                                    
                                    <label>Kapak Görseli URL</label>
                                    <input value={project.thumbnail_url || ''} onChange={e => setProject({...project, thumbnail_url: e.target.value})} />

                                    <label>Etiketler (Virgülle ayırın)</label>
                                    <input value={project.tags?.join(', ') || ''} onChange={e => setProject({...project, tags: e.target.value.split(',').map(s => s.trim())})} />

                                    <div className="grid-2">
                                        <div>
                                            <label>Görünürlük</label>
                                            <select value={project.visibility} onChange={e => setProject({...project, visibility: e.target.value as any})}>
                                                <option value="public">Herkese Açık</option>
                                                <option value="private">Özel</option>
                                                <option value="school">Okul İçi</option>
                                                <option value="class">Sınıf İçi</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label>Ekran Oranı</label>
                                            <select value={currentLevel.config.canvas_ratio || '16:9'} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, canvas_ratio: e.target.value as any } })}>
                                                <option value="16:9">16:9 (Geniş)</option>
                                                <option value="4:3">4:3 (Standart)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <label>Başlangıç Mesajı</label>
                                    <input value={project.data.settings.initial_message || ''} onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, initial_message: e.target.value}}})} />

                                    <label>Bitiş Mesajı</label>
                                    <input value={project.data.settings.completion_message || ''} onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, completion_message: e.target.value}}})} />
                                </div>
                            )}

                            {activeTab === 'levels' && (
                                <div className="levels-manager">
                                    <button className="btn-add-level" onClick={addLevel}>
                                        <Plus size={16} /> Yeni Seviye Ekle
                                    </button>
                                    <div className="levels-list">
                                        {project.data.levels.map((lvl, idx) => (
                                            <div key={lvl.id} style={{ marginBottom: '16px' }}>
                                                <div 
                                                    className={`level-item ${selectedLevelIndex === idx ? 'selected' : ''}`}
                                                    onClick={() => setSelectedLevelIndex(idx)}
                                                >
                                                    <span className="idx">{idx + 1}</span>
                                                    <div className="details">
                                                        <strong>{lvl.title}</strong>
                                                        <span>{lvl.correct_concepts.length + lvl.wrong_concepts.length} Kavram</span>
                                                    </div>
                                                    <div className="actions">
                                                        <button onClick={(e) => { e.stopPropagation(); duplicateLevel(idx); }}><Copy size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteLevel(idx); }} className="delete"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                                
                                                {/* Targets section removed */}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'concepts' && (
                                <div className="concepts-manager">
                                    <h3>{currentLevel.title} - Kavramlar</h3>
                                    
                                    <div className="search-box" style={{ marginBottom: '16px' }}>
                                        <input 
                                            placeholder="Kavramlarda ara..." 
                                            value={conceptSearch} 
                                            onChange={e => setConceptSearch(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                                        />
                                    </div>

                                    <div className="concept-section">
                                        <h4>Doğru Kavramlar</h4>
                                        {currentLevel.correct_concepts.filter(c => c.text.toLowerCase().includes(conceptSearch.toLowerCase())).map((c, i) => (
                                            <div key={i} className="concept-row">
                                                <input value={c.text} onChange={e => {
                                                    const newList = [...currentLevel.correct_concepts];
                                                    newList[i].text = e.target.value;
                                                    updateCurrentLevel({ correct_concepts: newList });
                                                }} placeholder="Kavram metni" style={{ flex: 1 }} />
                                                <button onClick={() => {
                                                    const newList = currentLevel.correct_concepts.filter((_, idx) => idx !== i);
                                                    updateCurrentLevel({ correct_concepts: newList });
                                                }}><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                        <button className="btn-small" onClick={() => updateCurrentLevel({ correct_concepts: [...currentLevel.correct_concepts, { text: '', category: currentLevel.targets[0]?.category || 'A', weight: 1 }] })}>
                                            + Ekle
                                        </button>
                                    </div>

                                    <div className="concept-section">
                                        <h4>Yanlış Kavramlar</h4>
                                        {currentLevel.wrong_concepts.filter(c => c.text.toLowerCase().includes(conceptSearch.toLowerCase())).map((c, i) => (
                                            <div key={i} className="concept-row">
                                                <input value={c.text} onChange={e => {
                                                    const newList = [...currentLevel.wrong_concepts];
                                                    newList[i].text = e.target.value;
                                                    updateCurrentLevel({ wrong_concepts: newList });
                                                }} placeholder="Kavram metni" style={{ flex: 1 }} />
                                                <button onClick={() => {
                                                    const newList = currentLevel.wrong_concepts.filter((_, idx) => idx !== i);
                                                    updateCurrentLevel({ wrong_concepts: newList });
                                                }}><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                        <button className="btn-small" onClick={() => updateCurrentLevel({ wrong_concepts: [...currentLevel.wrong_concepts, { text: '', category: 'Wrong', weight: 1 }] })}>
                                            + Ekle
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'visual' && (
                                <div className="visual-settings">
                                    <h3>{currentLevel.title} - Görsel Tasarım</h3>
                                    
                                    <AssetPicker 
                                        type="background" 
                                        label="Arka Plan Görseli" 
                                        value={currentLevel.background} 
                                        onChange={val => updateCurrentLevel({ background: val })} 
                                    />

                                    <AssetPicker 
                                        type="spritesheet" 
                                        label="Oyuncu Karakteri (Sprite)" 
                                        value={currentLevel.config.player_image || ''} 
                                        onChange={val => updateCurrentLevel({ config: { ...currentLevel.config, player_image: val } })} 
                                    />

                                    <label>Doğru Efekti</label>
                                    <select value={currentLevel.effect_correct || 'sparkle'} onChange={e => updateCurrentLevel({ effect_correct: e.target.value })}>
                                        <option value="sparkle">Parlamaz</option>
                                        <option value="glow">Işıma</option>
                                        <option value="pop">Büyüme</option>
                                    </select>

                                    <label>Hata Efekti</label>
                                    <select value={currentLevel.effect_wrong || 'shake'} onChange={e => updateCurrentLevel({ effect_wrong: e.target.value })}>
                                        <option value="shake">Sarsıntı</option>
                                        <option value="tint">Kızarma</option>
                                        <option value="fade">Kararma</option>
                                    </select>
                                </div>
                            )}

                            {activeTab === 'audio' && (
                                <div className="audio-settings">
                                    <h3>{currentLevel.title} - Ses ve Müzik</h3>
                                    
                                    <AssetPicker 
                                        type="music" 
                                        label="Seviye Müziği" 
                                        value={currentLevel.music_url || ''} 
                                        onChange={val => updateCurrentLevel({ music_url: val })} 
                                    />

                                    <AssetPicker 
                                        type="sound" 
                                        label="Doğru Yakalama Sesi" 
                                        value={currentLevel.config.sound_correct || ''} 
                                        onChange={val => updateCurrentLevel({ config: { ...currentLevel.config, sound_correct: val } })} 
                                    />

                                    <AssetPicker 
                                        type="sound" 
                                        label="Hata Ses Efekti" 
                                        value={currentLevel.config.sound_wrong || ''} 
                                        onChange={val => updateCurrentLevel({ config: { ...currentLevel.config, sound_wrong: val } })} 
                                    />
                                </div>
                            )}

                            {activeTab === 'gameplay' && (
                                <div className="gameplay-settings">
                                    <h3>{currentLevel.title} - Oynanış</h3>
                                    
                                    <label>Süre (Saniye)</label>
                                    <div className="slider-input">
                                        <input type="range" min="10" max="300" step="10" value={currentLevel.duration} onChange={e => updateCurrentLevel({ duration: parseInt(e.target.value) })} />
                                        <input type="number" value={currentLevel.duration} onChange={e => updateCurrentLevel({ duration: parseInt(e.target.value) })} />
                                    </div>

                                    <label>Nesne Üretim Hızı (ms)</label>
                                    <div className="slider-input">
                                        <input type="range" min="500" max="5000" step="100" value={currentLevel.config.spawnRate} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, spawnRate: parseInt(e.target.value) } })} />
                                        <input type="number" value={currentLevel.config.spawnRate} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, spawnRate: parseInt(e.target.value) } })} />
                                    </div>

                                    <label>Düşme Hızı</label>
                                    <div className="slider-input">
                                        <input type="range" min="50" max="1000" step="50" value={currentLevel.config.itemSpeed} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, itemSpeed: parseInt(e.target.value) } })} />
                                        <input type="number" value={currentLevel.config.itemSpeed} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, itemSpeed: parseInt(e.target.value) } })} />
                                    </div>

                                    <label>Yerçekimi</label>
                                    <div className="slider-input">
                                        <input type="range" min="0" max="1000" step="50" value={currentLevel.config.gravityY} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, gravityY: parseInt(e.target.value) } })} />
                                        <input type="number" value={currentLevel.config.gravityY} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, gravityY: parseInt(e.target.value) } })} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={currentLevel.config.rotation_enabled} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, rotation_enabled: e.target.checked } })} />
                                            Nesne Dönüşü Aktif
                                        </label>
                                    </div>

                                    {currentLevel.config.rotation_enabled && (
                                        <>
                                            <label>Dönüş Hızı</label>
                                            <div className="slider-input">
                                                <input type="range" min="1" max="10" step="1" value={currentLevel.config.rotation_speed || 3} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, rotation_speed: parseInt(e.target.value) } })} />
                                                <input type="number" value={currentLevel.config.rotation_speed || 3} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, rotation_speed: parseInt(e.target.value) } })} />
                                            </div>
                                        </>
                                    )}

                                    <label>Maksimum Hata Sayısı</label>
                                    <div className="slider-input">
                                        <input type="range" min="1" max="10" step="1" value={currentLevel.max_errors || 3} onChange={e => updateCurrentLevel({ max_errors: parseInt(e.target.value) })} />
                                        <input type="number" value={currentLevel.max_errors || 3} onChange={e => updateCurrentLevel({ max_errors: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'screens' && (
                                <div className="screens-settings">
                                    <h3 style={{ marginBottom: '8px' }}>Oyun Ekranları - {currentLevel.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
                                        Oyunun farklı aşamalarında oyuncuya gösterilecek mesajları ve görselleri ayarlayın.
                                    </p>

                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-main)', padding: '6px', borderRadius: '10px' }}>
                                        {[
                                            { id: 'cover', label: 'Kapak' },
                                            { id: 'infoStart', label: 'Bilgi (Baş)' },
                                            { id: 'victory', label: 'Zafer' },
                                            { id: 'defeat', label: 'Yenilgi' },
                                            { id: 'infoEnd', label: 'Bilgi (Son)' }
                                        ].map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => setActiveScreen(s.id as any)}
                                                style={{ 
                                                    flex: 1, 
                                                    padding: '8px', 
                                                    borderRadius: '6px', 
                                                    border: 'none', 
                                                    background: activeScreen === s.id ? 'var(--primary-color)' : 'transparent',
                                                    color: activeScreen === s.id ? 'white' : 'var(--text-secondary)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>

                                    {(currentLevel.screens?.[activeScreen]) && (
                                        <div className="settings-group">
                                            {(activeScreen === 'infoStart' || activeScreen === 'infoEnd') && (
                                                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={currentLevel.screens[activeScreen].enabled} 
                                                        onChange={e => {
                                                            const newScreens = { ...currentLevel.screens };
                                                            newScreens[activeScreen].enabled = e.target.checked;
                                                            updateCurrentLevel({ screens: newScreens });
                                                        }}
                                                        style={{ width: 'auto', margin: 0 }}
                                                    />
                                                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Bu ekranı aktifleştir</span>
                                                </div>
                                            )}

                                            <label>Başlık</label>
                                            <input 
                                                value={currentLevel.screens[activeScreen].title}
                                                onChange={e => {
                                                    const newScreens = { ...currentLevel.screens };
                                                    newScreens[activeScreen].title = e.target.value;
                                                    updateCurrentLevel({ screens: newScreens });
                                                }}
                                            />

                                            <label>Açıklama / Mesaj</label>
                                            <textarea 
                                                rows={3}
                                                value={currentLevel.screens[activeScreen].description}
                                                onChange={e => {
                                                    const newScreens = { ...currentLevel.screens };
                                                    newScreens[activeScreen].description = e.target.value;
                                                    updateCurrentLevel({ screens: newScreens });
                                                }}
                                            />

                                            <label>Buton Metni</label>
                                            <input 
                                                value={currentLevel.screens[activeScreen].buttonText}
                                                onChange={e => {
                                                    const newScreens = { ...currentLevel.screens };
                                                    newScreens[activeScreen].buttonText = e.target.value;
                                                    updateCurrentLevel({ screens: newScreens });
                                                }}
                                            />

                                            <div className="grid-2">
                                                <AssetPicker 
                                                    type="background" 
                                                    label="Özel Arka Plan" 
                                                    value={currentLevel.screens[activeScreen].background || ''} 
                                                    onChange={val => {
                                                        const newScreens = { ...currentLevel.screens };
                                                        newScreens[activeScreen].background = val;
                                                        updateCurrentLevel({ screens: newScreens });
                                                    }} 
                                                />
                                                <AssetPicker 
                                                    type="music" 
                                                    label="Özel Müzik" 
                                                    value={currentLevel.screens[activeScreen].music || ''} 
                                                    onChange={val => {
                                                        const newScreens = { ...currentLevel.screens };
                                                        newScreens[activeScreen].music = val;
                                                        updateCurrentLevel({ screens: newScreens });
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* CENTER PANEL: Live Preview */}
                    <main className="editor-center-panel">
                        <div className="preview-container">
                            <div className="preview-toolbar">
                                <span>CANLI ÖNİZLEME: {currentLevel.title}</span>
                                <button onClick={() => { setTestMode('single'); setIsTesting(true); }}>
                                    <Play size={14} /> Seviyeyi Dene
                                </button>
                            </div>
                            <div className="phaser-preview-placeholder">
                                {/* Real Phaser Game would go here for live preview */}
                                <div className="bg-preview" style={{ background: `url(/assets/bg.png) center/cover` }}>
                                    <div className="preview-ui">
                                        <div className="score">Skor: 0</div>
                                        <div className="timer">{Math.floor(currentLevel.duration / 60)}:{(currentLevel.duration % 60).toString().padStart(2, '0')}</div>
                                    </div>
                                    <div className="instruction">{currentLevel.instruction}</div>
                                    <div className="objects-preview">
                                        {currentLevel.correct_concepts.slice(0, 2).map((c, i) => (
                                            <div key={i} className="falling-item">{c.text}</div>
                                        ))}
                                    </div>
                                    <div className="player-preview"></div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* RIGHT PANEL: Info & Checks */}
                    {showSummary && (
                        <aside className="editor-right-panel">
                            <div className="panel-header">
                                <Info size={16} /> Durum Özeti
                            </div>
                            <div className="summary-list">
                                <div className="summary-item success">
                                    <ChevronRight size={14} /> {project.data.levels.length} Seviye Hazır
                                </div>
                                <div className={`summary-item ${currentLevel.correct_concepts.length > 0 ? 'success' : 'warning'}`}>
                                    <ChevronRight size={14} /> Kavramlar: {currentLevel.correct_concepts.length} Doğru / {currentLevel.wrong_concepts.length} Yanlış
                                </div>
                                <div className="summary-item info">
                                    <ChevronRight size={14} /> Hedef Skor: {currentLevel.target_score}
                                </div>
                            </div>
                            
                            <div className="quick-actions">
                                <h4>Hızlı Şablonlar</h4>
                                <button className="btn-template" onClick={applyPhysicalQuantitiesTemplate}>Fiziksel Büyüklükler</button>
                                <button className="btn-template">Elementler & Bileşikler</button>
                            </div>
                        </aside>
                    )}
                </div>

                {/* Full Screen Test Modal */}
                {isTesting && (
                    <div className="test-modal">
                        <div className="modal-content">
                            <button className="btn-close" onClick={() => setIsTesting(false)}>
                                <X size={24} /> Kapat
                            </button>
                            <GameContainer projectData={project} levelIndex={testMode === 'single' ? selectedLevelIndex : 0} isTestMode={true} />
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .editor-container {
                    height: calc(100vh - 64px);
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-main);
                    color: var(--text-primary);
                    font-family: 'Inter', sans-serif;
                }

                /* Slim Header Styles */
                .editor-header {
                    height: 56px;
                    padding: 0 24px;
                    background: var(--bg-surface);
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    z-index: 100;
                }

                .header-left { display: flex; align-items: center; gap: 40px; }
                
                .project-meta { display: flex; align-items: center; gap: 12px; }
                .project-meta h1 { 
                    margin: 0; 
                    font-size: 1rem; 
                    font-weight: 700; 
                    max-width: 200px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .status-badge { 
                    font-size: 0.65rem; 
                    padding: 2px 8px; 
                    background: var(--primary-color); 
                    color: white;
                    border-radius: 4px; 
                    font-weight: 800;
                }

                .phase-nav { display: flex; gap: 4px; }
                .phase-btn {
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .phase-btn:hover { background: rgba(0,0,0,0.05); color: var(--text-primary); }
                .phase-btn.active { background: var(--bg-main); color: var(--primary-color); }

                .header-actions { display: flex; align-items: center; gap: 12px; }
                .btn-icon {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon:hover { background: rgba(0,0,0,0.05); color: var(--text-primary); }
                .btn-icon.active { color: var(--primary-color); background: rgba(var(--primary-rgb), 0.1); border-color: var(--primary-color); }

                .btn-test, .btn-save {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-test { background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-primary); }
                .btn-save { background: var(--primary-color); border: none; color: white; }
                .btn-exit { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 8px; }

                .editor-main-layout {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }

                /* Sidebar Styles */
                .editor-left-panel {
                    width: 280px;
                    border-right: 1px solid var(--border-color);
                    background: var(--bg-surface);
                    display: flex;
                    flex-direction: column;
                }

                .editor-tabs {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    border-bottom: 1px solid var(--border-color);
                }

                .editor-tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                    text-align: left;
                }

                .editor-tab-btn.active {
                    background: rgba(var(--primary-rgb), 0.1);
                    color: var(--primary-color);
                }
                
                .editor-tab-btn:hover:not(.active) {
                    background: rgba(0,0,0,0.03);
                }

                .editor-tab-btn .icon-wrapper {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .editor-tab-btn span { font-size: 0.85rem; font-weight: 500; }

                .tab-content { 
                    flex: 1; 
                    padding: 20px; 
                    overflow-y: auto; 
                }

                .tab-content h3 { margin-top: 0; margin-bottom: 24px; font-size: 1.1rem; font-weight: 700; }

                .settings-group label { display: block; font-size: 0.8rem; margin-bottom: 6px; color: var(--text-secondary); }
                .settings-group input, .settings-group textarea {
                    width: 100%; padding: 10px; margin-bottom: 16px; border-radius: 8px;
                    border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary);
                }

                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

                .levels-manager .btn-add-level {
                    width: 100%; padding: 12px; border-radius: 8px; border: 2px dashed var(--border-color);
                    background: transparent; color: var(--text-secondary); cursor: pointer; margin-bottom: 16px;
                }

                .level-item {
                    display: flex; align-items: center; padding: 12px; border-radius: 10px;
                    background: var(--bg-main); border: 1px solid var(--border-color); margin-bottom: 8px;
                    cursor: pointer; transition: all 0.2s;
                }

                .level-item.selected { border-color: var(--primary-color); background: rgba(var(--primary-rgb), 0.05); }
                .level-item .idx { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--bg-surface); border-radius: 50%; font-size: 0.7rem; margin-right: 12px; }
                .level-item .details { flex: 1; }
                .level-item .details strong { display: block; font-size: 0.9rem; }
                .level-item .details span { font-size: 0.7rem; color: var(--text-secondary); }
                .level-item .actions { display: flex; gap: 4px; opacity: 0; }
                .level-item:hover .actions { opacity: 1; }
                .level-item .actions button { border: none; background: transparent; padding: 4px; color: var(--text-secondary); cursor: pointer; }
                .level-item .actions button.delete:hover { color: #ef4444; }

                .concept-section { margin-bottom: 24px; }
                .concept-section h4 { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px; }
                .concept-row { display: flex; gap: 8px; margin-bottom: 8px; }
                .concept-row input { flex: 1; padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-input); }
                .concept-row button { border: none; background: transparent; color: var(--text-secondary); cursor: pointer; }

                .slider-input { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
                .slider-input input[type="range"] { flex: 1; }
                .slider-input input[type="number"] { width: 60px; padding: 4px; text-align: center; }

                .editor-center-panel { flex: 1; background: var(--bg-main); padding: 40px; overflow: hidden; display: flex; flex-direction: column; }
                .preview-container { flex: 1; background: var(--bg-surface); border-radius: 16px; border: 1px solid var(--border-color); display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                .preview-toolbar { padding: 12px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; font-weight: bold; }
                .preview-toolbar button { padding: 4px 12px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-main); cursor: pointer; display: flex; align-items: center; gap: 6px; }

                .phaser-preview-placeholder { flex: 1; position: relative; overflow: hidden; padding: 20px; }
                .bg-preview { width: 100%; height: 100%; border-radius: 8px; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                
                .preview-ui { position: absolute; top: 0; left: 0; width: 100%; padding: 15px; display: flex; justify-content: space-between; color: white; font-weight: bold; }
                .instruction { position: absolute; top: 60px; background: rgba(0,0,0,0.5); padding: 5px 15px; border-radius: 20px; color: white; font-size: 0.9rem; }
                
                .targets-preview { position: absolute; bottom: 40px; display: flex; gap: 20px; }
                .target-box { width: 120px; height: 70px; border: 2px dashed rgba(255,255,255,0.5); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem; font-weight: bold; text-align: center; }
                
                .falling-item { padding: 8px 16px; background: white; border-radius: 20px; color: #333; font-weight: bold; font-size: 0.8rem; position: absolute; top: 120px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
                .player-preview { width: 100px; height: 20px; background: white; border-radius: 10px; position: absolute; bottom: 10px; }

                .editor-right-panel { width: 260px; border-left: 1px solid var(--border-color); background: var(--bg-surface); padding: 20px; }
                .panel-header { font-weight: bold; font-size: 0.9rem; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
                .summary-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }
                .summary-item { font-size: 0.8rem; display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 6px; }
                .summary-item.success { color: #10b981; background: rgba(16, 185, 129, 0.1); }
                .summary-item.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
                .summary-item.info { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }

                .quick-actions h4 { font-size: 0.8rem; margin-bottom: 12px; }
                .btn-template { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-main); text-align: left; font-size: 0.8rem; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
                .btn-template:hover { background: var(--bg-surface); border-color: var(--primary-color); }

                .test-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-content { position: relative; width: 1024px; height: 768px; }
                .btn-close { position: absolute; top: -50px; right: 0; background: transparent; border: none; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 1rem; }
            `}</style>
        </MainLayout>
    );
};
