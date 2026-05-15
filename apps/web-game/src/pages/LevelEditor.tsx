import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { GameContainer } from '../components/game/GameContainer';
import type { GameProject, LevelData, ConceptData, TargetData } from '../game/types';
import { 
    Save, Plus, Trash2, Settings as SettingsIcon, Layout, Database, 
    Play, X, ChevronRight, Copy, ArrowUp, ArrowDown, Info, 
    Palette, Music, Zap, BarChart2, Globe, Monitor, Trophy, Flag, ChevronDown
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

type EditorTab = 'basics' | 'concepts' | 'screens' | 'visual' | 'audio' | 'gameplay' | 'scoring' | 'publishing' | 'system';
type EditorPhase = 'basics' | 'content' | 'design' | 'rules';

// --- Helper Functions ---
function createGlobalScreens() {
    return {
        cover: { title: 'Hazır mısın?', description: 'Tüm doğru nesneleri yakalayarak puan kazan!', buttonText: 'Oyunu Başlat' },
        victory: { title: 'Harika!', description: 'Tüm seviyeleri başarıyla tamamladın.', buttonText: 'Kütüphaneye Dön' },
        defeat: { title: 'Olamaz!', description: 'Skorun yetersiz kaldı. Tekrar denemek ister misin?', buttonText: 'Tekrar Dene' }
    };
}

function createLevelScreens() {
    return {
        infoStart: { title: 'Bilgi', description: 'Bu seviyede fiziksel büyüklükleri öğreneceğiz.', buttonText: 'Anladım', enabled: false },
        infoEnd: { title: 'Özet', description: 'Harika iş çıkardın! Temel büyüklükleri kavradın.', buttonText: 'Devam Et', enabled: false }
    };
}

function createDefaultLevel(title: string): LevelData {
    return {
        id: crypto.randomUUID(),
        title,
        instruction: 'Doğru nesneleri yakala!',
        learning_goal: '',
        background: 'background',
        targets: [
            { category: 'A', label: 'Hedef A', color: 0x6366f1, x: 256, y: 648, width: 200, height: 120 },
            { category: 'B', label: 'Hedef B', color: 0xec4899, x: 768, y: 648, width: 200, height: 120 }
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
        screens: createLevelScreens()
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
                settings: { showLeaderboard: true, allowRetries: true },
                common_screens: createGlobalScreens()
            }
        };
    });

    // --- Migration and Initialization ---
    useEffect(() => {
        let projectUpdated = false;
        const newProject = { ...project };

        // 1. Initialize common_screens if missing
        if (!newProject.data.common_screens) {
            newProject.data.common_screens = newProject.data.levels[0]?.screens?.cover ? {
                cover: { ...newProject.data.levels[0].screens.cover },
                victory: { ...newProject.data.levels[0].screens.victory },
                defeat: { ...newProject.data.levels[0].screens.defeat }
            } : createGlobalScreens();
            projectUpdated = true;
        }

        // 2. Ensure each level only has level-specific screens (infoStart, infoEnd)
        newProject.data.levels = newProject.data.levels.map(lvl => {
            const hasInfoStart = lvl.screens && 'infoStart' in lvl.screens;
            const hasInfoEnd = lvl.screens && 'infoEnd' in lvl.screens;
            
            if (!hasInfoStart || !hasInfoEnd) {
                projectUpdated = true;
                const defaultScreens = createLevelScreens();
                return {
                    ...lvl,
                    screens: {
                        infoStart: lvl.screens?.infoStart || defaultScreens.infoStart,
                        infoEnd: lvl.screens?.infoEnd || defaultScreens.infoEnd
                    }
                };
            }
            
            // Cleanup: remove global screens from level if they exist
            if ('cover' in lvl.screens || 'victory' in lvl.screens || 'defeat' in lvl.screens) {
                projectUpdated = true;
                return {
                    ...lvl,
                    screens: {
                        infoStart: lvl.screens.infoStart,
                        infoEnd: lvl.screens.infoEnd
                    }
                };
            }
            
            return lvl;
        });

        if (projectUpdated) {
            setProject(newProject);
        }
    }, []);

    useEffect(() => {
        if (location.state?.projectToLoad) {
            // Clear navigation state to prevent re-loading on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const [activeTab, setActiveTab] = useState<EditorTab>('basics');
    const [activePhase, setActivePhase] = useState<EditorPhase>('basics');
    const [activeScreen, setActiveScreen] = useState<'cover' | 'victory' | 'defeat' | 'infoStart' | 'infoEnd' | null>('cover');
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <select 
                        value={filtered.some(a => a.url === value) ? value : 'custom'} 
                        onChange={(e) => {
                            if (e.target.value !== 'custom') onChange(e.target.value);
                        }}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
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
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
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
                config: { spawnRate: 1500, gravityY: 300, playerSpeed: 600, itemSpeed: 200 },
                screens: {
                    cover: { title: 'Temel Büyüklükler', description: 'Yalnızca temel büyüklükleri yakalayarak puan kazan!', buttonText: 'Oyunu Başlat' },
                    victory: { title: 'Tebrikler!', description: 'Temel büyüklükleri başarıyla kavradın.', buttonText: 'Sıradaki Seviye' },
                    defeat: { title: 'Hatalı Seçim!', description: 'Skorun yetersiz kaldı. Tekrar denemek ister misin?', buttonText: 'Tekrar Dene' },
                    infoStart: { title: 'Bilgi', description: 'Bu seviyede fiziksel büyüklükleri öğreneceğiz.', buttonText: 'Anladım', enabled: false },
                    infoEnd: { title: 'Özet', description: 'Harika iş çıkardın! Temel büyüklükleri kavradın.', buttonText: 'Devam Et', enabled: false }
                }
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
                config: { spawnRate: 1400, gravityY: 350, playerSpeed: 600, itemSpeed: 220 },
                screens: createDefaultScreens()
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
                config: { spawnRate: 1300, gravityY: 400, playerSpeed: 600, itemSpeed: 240 },
                screens: createDefaultScreens()
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
                config: { spawnRate: 1200, gravityY: 450, playerSpeed: 600, itemSpeed: 260 },
                screens: createDefaultScreens()
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
                if (id === 'basics') setActiveTab('basics');
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
                            <span className="status-badge">{project.status}</span>
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
                            <nav className={`editor-tabs ${(activePhase === 'design' || activePhase === 'rules') ? 'vertical' : ''}`}>
                                {activePhase === 'basics' && (
                                    <>
                                        {renderTabButton('basics', 'Temeller', <Globe size={18} />)}
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
                                        {renderTabButton('system', 'Sistem', <SettingsIcon size={18} />)}
                                        {renderTabButton('publishing', 'Yayınla', <Globe size={18} />)}
                                    </>
                                )}
                            </nav>

                        <div className="tab-content">
                            {activePhase === 'basics' && (
                                <div className="basics-container">
                                    <div className="settings-group">
                                        <h3>Proje Genel Bilgileri</h3>
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
                                        
                                        <AssetPicker 
                                            type="background" 
                                            label="Kapak Görseli" 
                                            value={project.thumbnail_url || ''} 
                                            onChange={val => setProject({...project, thumbnail_url: val})} 
                                        />

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
                                                <label>Proje Durumu</label>
                                                <select value={project.status} onChange={e => setProject({...project, status: e.target.value as any})}>
                                                    <option value="draft">Taslak</option>
                                                    <option value="published">Yayında</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="settings-group" style={{ marginTop: '24px', borderTop: '2px solid var(--border-color)', paddingTop: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ margin: 0 }}>Oyun Seviyeleri</h3>
                                            <button className="btn-add-level" onClick={addLevel} style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', margin: 0 }}>
                                                <Plus size={14} /> Ekle
                                            </button>
                                        </div>
                                        
                                        <div className="levels-list">
                                            {project.data.levels.map((lvl, idx) => (
                                                <div 
                                                    key={lvl.id} 
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
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'concepts' && (
                                <div className="level-accordions-container">
                                    {project.data.levels.map((lvl, idx) => {
                                        const isLevelOpen = selectedLevelIndex === idx;
                                        return (
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`} style={{ marginBottom: '12px', border: '2px solid', borderColor: isLevelOpen ? 'var(--primary-color)' : 'var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <div 
                                                    className="level-accordion-header" 
                                                    onClick={() => setSelectedLevelIndex(idx)}
                                                    style={{ padding: '12px 16px', background: isLevelOpen ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{idx + 1}</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{lvl.title}</strong>
                                                    </div>
                                                    <ChevronDown size={18} style={{ transform: isLevelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                                </div>

                                                {isLevelOpen && (
                                                    <div style={{ padding: '16px', background: 'var(--bg-main)' }}>
                                                        <div className="search-box" style={{ marginBottom: '16px' }}>
                                                            <input 
                                                                placeholder={`${lvl.title} kavramlarında ara...`} 
                                                                value={conceptSearch} 
                                                                onChange={e => setConceptSearch(e.target.value)}
                                                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}
                                                            />
                                                        </div>

                                                        <div className="concept-section">
                                                            <h4>Doğru Kavramlar</h4>
                                                            {lvl.correct_concepts.filter(c => c.text.toLowerCase().includes(conceptSearch.toLowerCase())).map((c, i) => (
                                                                <div key={i} className="concept-row">
                                                                    <input value={c.text} onChange={e => {
                                                                        const newList = [...lvl.correct_concepts];
                                                                        newList[i].text = e.target.value;
                                                                        updateCurrentLevel({ correct_concepts: newList });
                                                                    }} placeholder="Kavram metni" style={{ flex: 1 }} />
                                                                    <button onClick={() => {
                                                                        const newList = lvl.correct_concepts.filter((_, conceptIdx) => conceptIdx !== i);
                                                                        updateCurrentLevel({ correct_concepts: newList });
                                                                    }}><Trash2 size={14} /></button>
                                                                </div>
                                                            ))}
                                                            <button className="btn-small" onClick={() => updateCurrentLevel({ correct_concepts: [...lvl.correct_concepts, { text: '', category: lvl.targets[0]?.category || 'A', weight: 1 }] })}>
                                                                + Ekle
                                                            </button>
                                                        </div>

                                                        <div className="concept-section" style={{ marginTop: '16px' }}>
                                                            <h4>Yanlış Kavramlar</h4>
                                                            {lvl.wrong_concepts.filter(c => c.text.toLowerCase().includes(conceptSearch.toLowerCase())).map((c, i) => (
                                                                <div key={i} className="concept-row">
                                                                    <input value={c.text} onChange={e => {
                                                                        const newList = [...lvl.wrong_concepts];
                                                                        newList[i].text = e.target.value;
                                                                        updateCurrentLevel({ wrong_concepts: newList });
                                                                    }} placeholder="Kavram metni" style={{ flex: 1 }} />
                                                                    <button onClick={() => {
                                                                        const newList = lvl.wrong_concepts.filter((_, conceptIdx) => conceptIdx !== i);
                                                                        updateCurrentLevel({ wrong_concepts: newList });
                                                                    }}><Trash2 size={14} /></button>
                                                                </div>
                                                            ))}
                                                            <button className="btn-small" onClick={() => updateCurrentLevel({ wrong_concepts: [...lvl.wrong_concepts, { text: '', category: 'Wrong', weight: 1 }] })}>
                                                                + Ekle
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'visual' && (
                                <div className="level-accordions-container">
                                    {project.data.levels.map((lvl, idx) => {
                                        const isLevelOpen = selectedLevelIndex === idx;
                                        return (
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`} style={{ marginBottom: '12px', border: '2px solid', borderColor: isLevelOpen ? 'var(--primary-color)' : 'var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <div 
                                                    className="level-accordion-header" 
                                                    onClick={() => setSelectedLevelIndex(idx)}
                                                    style={{ padding: '12px 16px', background: isLevelOpen ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{idx + 1}</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{lvl.title}</strong>
                                                    </div>
                                                    <ChevronDown size={18} style={{ transform: isLevelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                                </div>

                                                {isLevelOpen && (
                                                    <div style={{ padding: '16px', background: 'var(--bg-main)' }}>
                                                        <AssetPicker 
                                                            type="background" 
                                                            label="Arka Plan Görseli" 
                                                            value={lvl.background} 
                                                            onChange={val => updateCurrentLevel({ background: val })} 
                                                        />

                                                        <AssetPicker 
                                                            type="spritesheet" 
                                                            label="Oyuncu Karakteri (Sprite)" 
                                                            value={lvl.config.player_image || ''} 
                                                            onChange={val => updateCurrentLevel({ config: { ...lvl.config, player_image: val } })} 
                                                        />

                                                        <div className="settings-group">
                                                            <label>Doğru Efekti</label>
                                                            <select value={lvl.effect_correct || 'sparkle'} onChange={e => updateCurrentLevel({ effect_correct: e.target.value })}>
                                                                <option value="sparkle">Parlamaz</option>
                                                                <option value="glow">Işıma</option>
                                                                <option value="pop">Büyüme</option>
                                                            </select>
                                                        </div>

                                                        <div className="settings-group">
                                                            <label>Hata Efekti</label>
                                                            <select value={lvl.effect_wrong || 'shake'} onChange={e => updateCurrentLevel({ effect_wrong: e.target.value })}>
                                                                <option value="shake">Sarsıntı</option>
                                                                <option value="tint">Kızarma</option>
                                                                <option value="fade">Kararma</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'audio' && (
                                <div className="level-accordions-container">
                                    {project.data.levels.map((lvl, idx) => {
                                        const isLevelOpen = selectedLevelIndex === idx;
                                        return (
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`} style={{ marginBottom: '12px', border: '2px solid', borderColor: isLevelOpen ? 'var(--primary-color)' : 'var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <div 
                                                    className="level-accordion-header" 
                                                    onClick={() => setSelectedLevelIndex(idx)}
                                                    style={{ padding: '12px 16px', background: isLevelOpen ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{idx + 1}</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{lvl.title}</strong>
                                                    </div>
                                                    <ChevronDown size={18} style={{ transform: isLevelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                                </div>

                                                {isLevelOpen && (
                                                    <div style={{ padding: '16px', background: 'var(--bg-main)' }}>
                                                        <AssetPicker 
                                                            type="music" 
                                                            label="Seviye Müziği" 
                                                            value={lvl.music_url || ''} 
                                                            onChange={val => updateCurrentLevel({ music_url: val })} 
                                                        />

                                                        <AssetPicker 
                                                            type="sound" 
                                                            label="Doğru Yakalama Sesi" 
                                                            value={lvl.config.sound_correct || ''} 
                                                            onChange={val => updateCurrentLevel({ config: { ...lvl.config, sound_correct: val } })} 
                                                        />

                                                        <AssetPicker 
                                                            type="sound" 
                                                            label="Hata Ses Efekti" 
                                                            value={lvl.config.sound_wrong || ''} 
                                                            onChange={val => updateCurrentLevel({ config: { ...lvl.config, sound_wrong: val } })} 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'gameplay' && (
                                <div className="level-accordions-container">
                                    {project.data.levels.map((lvl, idx) => {
                                        const isLevelOpen = selectedLevelIndex === idx;
                                        return (
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`} style={{ marginBottom: '12px', border: '2px solid', borderColor: isLevelOpen ? 'var(--primary-color)' : 'var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <div 
                                                    className="level-accordion-header" 
                                                    onClick={() => setSelectedLevelIndex(idx)}
                                                    style={{ padding: '12px 16px', background: isLevelOpen ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{idx + 1}</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{lvl.title}</strong>
                                                    </div>
                                                    <ChevronDown size={18} style={{ transform: isLevelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                                </div>

                                                {isLevelOpen && (
                                                    <div style={{ padding: '16px', background: 'var(--bg-main)' }}>
                                                        <label>Süre (Saniye)</label>
                                                        <div className="slider-input">
                                                            <input type="range" min="10" max="300" step="10" value={lvl.duration} onChange={e => updateCurrentLevel({ duration: parseInt(e.target.value) })} />
                                                            <input type="number" value={lvl.duration} onChange={e => updateCurrentLevel({ duration: parseInt(e.target.value) })} />
                                                        </div>

                                                        <label>Nesne Üretim Hızı (ms)</label>
                                                        <div className="slider-input">
                                                            <input type="range" min="500" max="5000" step="100" value={lvl.config.spawnRate} onChange={e => updateCurrentLevel({ config: { ...lvl.config, spawnRate: parseInt(e.target.value) } })} />
                                                            <input type="number" value={lvl.config.spawnRate} onChange={e => updateCurrentLevel({ config: { ...lvl.config, spawnRate: parseInt(e.target.value) } })} />
                                                        </div>

                                                        <label>Düşme Hızı</label>
                                                        <div className="slider-input">
                                                            <input type="range" min="50" max="1000" step="50" value={lvl.config.itemSpeed} onChange={e => updateCurrentLevel({ config: { ...lvl.config, itemSpeed: parseInt(e.target.value) } })} />
                                                            <input type="number" value={lvl.config.itemSpeed} onChange={e => updateCurrentLevel({ config: { ...lvl.config, itemSpeed: parseInt(e.target.value) } })} />
                                                        </div>

                                                        <label>Yerçekimi</label>
                                                        <div className="slider-input">
                                                            <input type="range" min="0" max="1000" step="50" value={lvl.config.gravityY} onChange={e => updateCurrentLevel({ config: { ...lvl.config, gravityY: parseInt(e.target.value) } })} />
                                                            <input type="number" value={lvl.config.gravityY} onChange={e => updateCurrentLevel({ config: { ...lvl.config, gravityY: parseInt(e.target.value) } })} />
                                                        </div>

                                                        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                                <input type="checkbox" checked={lvl.config.rotation_enabled} onChange={e => updateCurrentLevel({ config: { ...lvl.config, rotation_enabled: e.target.checked } })} />
                                                                Nesne Dönüşü Aktif
                                                            </label>
                                                        </div>

                                                        {lvl.config.rotation_enabled && (
                                                            <>
                                                                <label>Dönüş Hızı</label>
                                                                <div className="slider-input">
                                                                    <input type="range" min="1" max="10" step="1" value={lvl.config.rotation_speed || 3} onChange={e => updateCurrentLevel({ config: { ...lvl.config, rotation_speed: parseInt(e.target.value) } })} />
                                                                    <input type="number" value={lvl.config.rotation_speed || 3} onChange={e => updateCurrentLevel({ config: { ...lvl.config, rotation_speed: parseInt(e.target.value) } })} />
                                                                </div>
                                                            </>
                                                        )}

                                                        <label>Maksimum Hata Sayısı</label>
                                                        <div className="slider-input">
                                                            <input type="range" min="1" max="10" step="1" value={lvl.max_errors || 3} onChange={e => updateCurrentLevel({ max_errors: parseInt(e.target.value) })} />
                                                            <input type="number" value={lvl.max_errors || 3} onChange={e => updateCurrentLevel({ max_errors: parseInt(e.target.value) })} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'scoring' && (
                                <div className="level-accordions-container">
                                    {project.data.levels.map((lvl, idx) => {
                                        const isLevelOpen = selectedLevelIndex === idx;
                                        return (
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`} style={{ marginBottom: '12px', border: '2px solid', borderColor: isLevelOpen ? 'var(--primary-color)' : 'var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <div 
                                                    className="level-accordion-header" 
                                                    onClick={() => setSelectedLevelIndex(idx)}
                                                    style={{ padding: '12px 16px', background: isLevelOpen ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{idx + 1}</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{lvl.title}</strong>
                                                    </div>
                                                    <ChevronDown size={18} style={{ transform: isLevelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                                </div>

                                                {isLevelOpen && (
                                                    <div style={{ padding: '16px', background: 'var(--bg-main)' }}>
                                                        <div className="settings-group">
                                                            <label>Hedef Skor</label>
                                                            <div className="slider-input">
                                                                <input type="range" min="10" max="1000" step="10" value={lvl.target_score} onChange={e => updateCurrentLevel({ target_score: parseInt(e.target.value) })} />
                                                                <input type="number" value={lvl.target_score} onChange={e => updateCurrentLevel({ target_score: parseInt(e.target.value) })} />
                                                            </div>
                                                        </div>

                                                        <div className="settings-group">
                                                            <label>Başarı Yüzdesi (%)</label>
                                                            <div className="slider-input">
                                                                <input type="range" min="10" max="100" step="5" value={lvl.success_percentage} onChange={e => updateCurrentLevel({ success_percentage: parseInt(e.target.value) })} />
                                                                <input type="number" value={lvl.success_percentage} onChange={e => updateCurrentLevel({ success_percentage: parseInt(e.target.value) })} />
                                                            </div>
                                                        </div>

                                                        <div className="grid-2" style={{ marginTop: '16px' }}>
                                                            <div className="settings-group">
                                                                <label>Doğru Puanı</label>
                                                                <input type="number" value={lvl.config.points_correct || 10} onChange={e => updateCurrentLevel({ config: { ...lvl.config, points_correct: parseInt(e.target.value) } })} />
                                                            </div>
                                                            <div className="settings-group">
                                                                <label>Hata Cezası</label>
                                                                <input type="number" value={lvl.config.points_wrong || 5} onChange={e => updateCurrentLevel({ config: { ...lvl.config, points_wrong: parseInt(e.target.value) } })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'system' && (
                                <div className="system-settings">
                                    <h3>Genel Sistem Ayarları</h3>
                                    
                                    <div className="settings-group" style={{ gap: '4px', marginBottom: '24px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={project.data.settings.showLeaderboard} 
                                                onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, showLeaderboard: e.target.checked}}})} 
                                                style={{ width: '18px', height: '18px', margin: 0, accentColor: 'var(--primary-color)' }}
                                            />
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Liderlik Tablosunu Göster</span>
                                        </label>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={project.data.settings.allowRetries} 
                                                onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, allowRetries: e.target.checked}}})} 
                                                style={{ width: '18px', height: '18px', margin: 0, accentColor: 'var(--primary-color)' }}
                                            />
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Tekrar Denemeye İzin Ver</span>
                                        </label>
                                    </div>

                                    <div className="settings-group">
                                        <label>Oyun Dili</label>
                                        <select value={project.language} onChange={e => setProject({...project, language: e.target.value})}>
                                            <option value="tr">Türkçe</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>

                                    <div className="settings-group">
                                        <label>Ekran Oranı (Varsayılan)</label>
                                        <select value={currentLevel.config.canvas_ratio || '16:9'} onChange={e => updateCurrentLevel({ config: { ...currentLevel.config, canvas_ratio: e.target.value as any } })}>
                                            <option value="16:9">16:9 (Geniş)</option>
                                            <option value="4:3">4:3 (Standart)</option>
                                        </select>
                                    </div>

                                    <div className="settings-group">
                                        <label>Başlangıç Mesajı (Global)</label>
                                        <input value={project.data.settings.initial_message || ''} onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, initial_message: e.target.value}}})} />
                                    </div>

                                    <div className="settings-group">
                                        <label>Bitiş Mesajı (Global)</label>
                                        <input value={project.data.settings.completion_message || ''} onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, completion_message: e.target.value}}})} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'publishing' && (
                                <div className="publishing-settings">
                                    <h3>Yayınlama Ayarları</h3>
                                    
                                    <div className="settings-group">
                                        <label>Görünürlük</label>
                                        <select value={project.visibility} onChange={e => setProject({...project, visibility: e.target.value as any})}>
                                            <option value="public">Herkese Açık</option>
                                            <option value="private">Özel</option>
                                            <option value="school">Okul İçi</option>
                                            <option value="class">Sınıf İçi</option>
                                        </select>
                                    </div>

                                    <div className="settings-group">
                                        <label>Proje Durumu</label>
                                        <select value={project.status} onChange={e => setProject({...project, status: e.target.value as any})}>
                                            <option value="draft">Taslak</option>
                                            <option value="published">Yayında</option>
                                            <option value="archived">Arşivlendi</option>
                                        </select>
                                    </div>

                                    <div className="info-box" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '20px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-primary)' }}>
                                            <strong>Not:</strong> Yayına alınan projeler kütüphanede tüm kullanıcılar tarafından görülebilir ve oynanabilir.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'screens' && (
                                <div className="level-accordions-container">
                                    {/* GLOBAL SCREENS ACCORDION */}
                                    <div className="level-accordion-item open" style={{ marginBottom: '24px', border: '2px solid var(--primary-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div 
                                            className="level-accordion-header" 
                                            style={{ padding: '12px 16px', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Globe size={18} color="var(--primary-color)" />
                                                <strong style={{ fontSize: '0.9rem' }}>Genel Oyun Ekranları</strong>
                                            </div>
                                        </div>
                                        <div style={{ padding: '16px', background: 'var(--bg-main)' }}>
                                            <div className="screens-accordion">
                                                {[
                                                    { id: 'cover', label: 'Kapak Ekranı', icon: <Monitor size={18} /> },
                                                    { id: 'victory', label: 'Tebrikler (Zafer)', icon: <Trophy size={18} /> },
                                                    { id: 'defeat', label: 'Oyun Bitti (Yenilgi)', icon: <X size={18} /> }
                                                ].map(s => {
                                                    const screenData = project.data.common_screens?.[s.id as keyof typeof project.data.common_screens];
                                                    const isOpen = activeScreen === s.id;
                                                    if (!screenData) return null;

                                                    return (
                                                        <div key={s.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
                                                            <div 
                                                                className="accordion-header" 
                                                                onClick={() => setActiveScreen(isOpen ? null : s.id as any)}
                                                            >
                                                                <div className="header-left">
                                                                    {s.icon}
                                                                    <span>{s.label}</span>
                                                                </div>
                                                                <ChevronDown size={16} className={`arrow ${isOpen ? 'up' : ''}`} />
                                                            </div>
                                                            {isOpen && (
                                                                <div className="accordion-content">
                                                                    <div className="settings-group">
                                                                        <label>Başlık</label>
                                                                        <input 
                                                                            value={screenData.title}
                                                                            onChange={e => setProject({
                                                                                ...project,
                                                                                data: {
                                                                                    ...project.data,
                                                                                    common_screens: {
                                                                                        ...project.data.common_screens!,
                                                                                        [s.id]: { ...screenData, title: e.target.value }
                                                                                    }
                                                                                }
                                                                            })}
                                                                        />
                                                                    </div>
                                                                    <div className="settings-group">
                                                                        <label>Açıklama</label>
                                                                        <textarea 
                                                                            rows={3}
                                                                            value={screenData.description}
                                                                            onChange={e => setProject({
                                                                                ...project,
                                                                                data: {
                                                                                    ...project.data,
                                                                                    common_screens: {
                                                                                        ...project.data.common_screens!,
                                                                                        [s.id]: { ...screenData, description: e.target.value }
                                                                                    }
                                                                                }
                                                                            })}
                                                                        />
                                                                    </div>
                                                                    <div className="settings-group">
                                                                        <label>Buton Metni</label>
                                                                        <input 
                                                                            value={screenData.buttonText}
                                                                            onChange={e => setProject({
                                                                                ...project,
                                                                                data: {
                                                                                    ...project.data,
                                                                                    common_screens: {
                                                                                        ...project.data.common_screens!,
                                                                                        [s.id]: { ...screenData, buttonText: e.target.value }
                                                                                    }
                                                                                }
                                                                            })}
                                                                        />
                                                                    </div>
                                                                    <div className="settings-group">
                                                                        <AssetPicker 
                                                                            type="background" 
                                                                            label="Özel Arka Plan" 
                                                                            value={(screenData as any).background || ''} 
                                                                            onChange={val => setProject({
                                                                                ...project,
                                                                                data: {
                                                                                    ...project.data,
                                                                                    common_screens: {
                                                                                        ...project.data.common_screens!,
                                                                                        [s.id]: { ...screenData, background: val }
                                                                                    }
                                                                                }
                                                                            })} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* LEVEL SPECIFIC ACCORDIONS */}
                                    <h4 style={{ fontSize: '0.8rem', margin: '0 0 12px 4px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seviye Ekranları</h4>
                                    {project.data.levels.map((lvl, idx) => {
                                        const isLevelOpen = selectedLevelIndex === idx;
                                        return (
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`} style={{ marginBottom: '12px', border: '2px solid', borderColor: isLevelOpen ? 'var(--primary-color)' : 'var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                                <div 
                                                    className="level-accordion-header" 
                                                    onClick={() => setSelectedLevelIndex(idx)}
                                                    style={{ padding: '12px 16px', background: isLevelOpen ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{idx + 1}</span>
                                                        <strong style={{ fontSize: '0.9rem' }}>{lvl.title}</strong>
                                                    </div>
                                                    <ChevronDown size={18} style={{ transform: isLevelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                                </div>

                                                {isLevelOpen && (
                                                    <div style={{ padding: '16px', background: 'var(--bg-main)' }}>
                                                        <div className="screens-accordion">
                                                            {/* Oyun Ekranı (Gameplay Media) */}
                                                            <div className={`accordion-item ${activeScreen === 'gameplay' ? 'open' : ''}`}>
                                                                <div className="accordion-header" onClick={() => setActiveScreen(activeScreen === 'gameplay' ? null : 'gameplay' as any)}>
                                                                    <div className="header-left"><Play size={18} /> <span>Oyun Ekranı</span></div>
                                                                    <ChevronDown size={16} className={`arrow ${activeScreen === 'gameplay' ? 'up' : ''}`} />
                                                                </div>
                                                                {activeScreen === 'gameplay' && (
                                                                    <div className="accordion-content">
                                                                        <div className="settings-group">
                                                                            <AssetPicker 
                                                                                type="background" 
                                                                                label="Oyun Arka Planı" 
                                                                                value={lvl.background} 
                                                                                onChange={val => updateCurrentLevel({ background: val })} 
                                                                            />
                                                                        </div>
                                                                        <div className="settings-group">
                                                                            <AssetPicker 
                                                                                type="music" 
                                                                                label="Oyun Müziği" 
                                                                                value={lvl.music_url || ''} 
                                                                                onChange={val => updateCurrentLevel({ music_url: val })} 
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {[
                                                                { id: 'infoStart', label: 'Başlangıç Bilgi Ekranı', icon: <Info size={18} /> },
                                                                { id: 'infoEnd', label: 'Bitiş Bilgi Ekranı', icon: <Flag size={18} /> }
                                                            ].map(s => {
                                                                const screenData = (lvl.screens as any)?.[s.id];
                                                                const isOpen = activeScreen === s.id;
                                                                if (!screenData) return null;
                                                                
                                                                return (
                                                                    <div key={s.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
                                                                        <div 
                                                                            className="accordion-header" 
                                                                            onClick={() => setActiveScreen(isOpen ? null : s.id as any)}
                                                                        >
                                                                            <div className="header-left">
                                                                                {s.icon}
                                                                                <span>{s.label}</span>
                                                                            </div>
                                                                            <ChevronDown size={16} className={`arrow ${isOpen ? 'up' : ''}`} />
                                                                        </div>
                                                                        
                                                                        {isOpen && (
                                                                            <div className="accordion-content">
                                                                                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                                                                    <input 
                                                                                        type="checkbox" 
                                                                                        checked={screenData.enabled} 
                                                                                        onChange={e => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].enabled = e.target.checked;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }}
                                                                                        style={{ width: '18px', height: '18px', margin: 0 }}
                                                                                    />
                                                                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Bu ekranı aktifleştir</span>
                                                                                </div>

                                                                                <div className="settings-group">
                                                                                    <label>Başlık</label>
                                                                                    <input 
                                                                                        value={screenData.title}
                                                                                        onChange={e => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].title = e.target.value;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                <div className="settings-group">
                                                                                    <label>Açıklama / Mesaj</label>
                                                                                    <textarea 
                                                                                        rows={3}
                                                                                        value={screenData.description}
                                                                                        onChange={e => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].description = e.target.value;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                <div className="settings-group">
                                                                                    <label>Buton Metni</label>
                                                                                    <input 
                                                                                        value={screenData.buttonText}
                                                                                        onChange={e => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].buttonText = e.target.value;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                <div className="settings-group">
                                                                                    <AssetPicker 
                                                                                        type="background" 
                                                                                        label="Özel Arka Plan" 
                                                                                        value={screenData.background || ''} 
                                                                                        onChange={val => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].background = val;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }} 
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* CENTER PANEL: Live Preview */}
                    <main className="editor-center-panel">
                        <div className="preview-container">
                            <div className="preview-toolbar">
                                <span>Canlı Önizleme: {currentLevel.title}</span>
                                <button onClick={() => { setTestMode('single'); setIsTesting(true); }}>
                                    <Play size={14} /> Seviyeyi Dene
                                </button>
                            </div>
                            <div className="phaser-preview-placeholder">
                                {activeTab === 'screens' ? (
                                    <div className="screen-preview-container" style={{ 
                                        background: (() => {
                                            const isCommon = ['cover', 'victory', 'defeat'].includes(activeScreen || '');
                                            const screenData = isCommon 
                                                ? project.data.common_screens?.[activeScreen as keyof typeof project.data.common_screens]
                                                : (currentLevel.screens as any)?.[activeScreen || ''];
                                            
                                            return (screenData?.background || currentLevel.background) 
                                                ? `url(${screenData?.background || currentLevel.background}) center/cover` 
                                                : 'var(--bg-main)';
                                        })(),
                                        opacity: (activeScreen === 'infoStart' || activeScreen === 'infoEnd') && !(currentLevel.screens as any)?.[activeScreen]?.enabled ? 0.5 : 1
                                    }}>
                                        <div className="screen-mockup-overlay">
                                            <div className="screen-content">
                                                {(() => {
                                                    const isCommon = ['cover', 'victory', 'defeat'].includes(activeScreen || '');
                                                    const screenData = isCommon 
                                                        ? project.data.common_screens?.[activeScreen as keyof typeof project.data.common_screens]
                                                        : (currentLevel.screens as any)?.[activeScreen || ''];
                                                    
                                                    if (activeScreen === 'gameplay') {
                                                        return (
                                                            <>
                                                                <h1>Oyun Ekranı</h1>
                                                                <p>Bu seviyenin oynanış arka planı ve müziği önizleniyor.</p>
                                                            </>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            <h1>{screenData?.title || 'Başlık Yok'}</h1>
                                                            <p>{screenData?.description || 'Açıklama girilmemiş.'}</p>
                                                            <button className="preview-game-btn">
                                                                {screenData?.buttonText || 'Devam Et'}
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            {(activeScreen === 'infoStart' || activeScreen === 'infoEnd') && !(currentLevel.screens as any)?.[activeScreen]?.enabled && (
                                                <div className="disabled-badge">Bu ekran kapalı</div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-preview" style={{ 
                                        background: currentLevel.background ? `url(${currentLevel.background}) center/cover` : 'var(--bg-main)',
                                        position: 'relative'
                                    }}>
                                        <div className="preview-ui">
                                            <div className="score">Skor: 0</div>
                                            <div className="timer">{Math.floor(currentLevel.duration / 60)}:{(currentLevel.duration % 60).toString().padStart(2, '0')}</div>
                                        </div>
                                        <div className="instruction" style={{ top: '60px' }}>{currentLevel.instruction}</div>
                                        <div className="objects-preview">
                                            {currentLevel.correct_concepts.slice(0, 2).map((c, i) => (
                                                <div key={i} className="falling-item" style={{ top: `${120 + i * 60}px`, left: `${100 + i * 150}px` }}>{c.text}</div>
                                            ))}
                                        </div>
                                        <div className="player-preview" style={{ 
                                            background: currentLevel.config.player_image ? `url(${currentLevel.config.player_image}) center/contain no-repeat` : 'white',
                                            width: '60px',
                                            height: '60px',
                                            bottom: '20px'
                                        }}></div>
                                    </div>
                                )}
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
                    height: 40px;
                    padding: 0 12px;
                    background: var(--bg-surface);
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    z-index: 100;
                }

                .header-left { display: flex; align-items: center; gap: 20px; }
                
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
                    padding: 4px 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .phase-btn:hover { background: rgba(0,0,0,0.05); color: var(--text-primary); }
                .phase-btn.active { background: var(--bg-main); color: var(--primary-color); }

                .header-actions { display: flex; align-items: center; gap: 8px; }
                .btn-icon {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    width: 32px;
                    height: 32px;
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
                    padding: 4px 12px;
                    border-radius: 8px;
                    font-size: 0.8rem;
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
                    width: 260px;
                    border-right: 1px solid var(--border-color);
                    background: var(--bg-surface);
                    display: flex;
                    flex-direction: column;
                }

                .editor-tabs {
                    margin: 8px 8px 4px 8px;
                    padding: 2px;
                    display: flex;
                    flex-direction: row;
                    background: var(--bg-input);
                    border-radius: 10px;
                    gap: 4px;
                    border: 1px solid var(--border-color);
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    position: relative;
                }

                .editor-tabs::-webkit-scrollbar {
                    display: none;
                }

                .editor-tabs::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 30px;
                    height: 100%;
                    background: linear-gradient(to left, var(--bg-input), transparent);
                    pointer-events: none;
                    border-radius: 0 10px 10px 0;
                    opacity: 0.8;
                }
                .editor-tabs.vertical {
                    flex-direction: column;
                    height: auto;
                    padding: 4px;
                    gap: 2px;
                }
                .editor-tabs.vertical .editor-tab-btn {
                    padding: 8px 12px;
                    justify-content: flex-start;
                }
                .editor-tabs.vertical .editor-tab-btn span {
                    font-size: 0.8rem;
                }
                .editor-tab-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 6px 4px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    border-radius: 7px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: center;
                    white-space: nowrap;
                }

                .editor-tab-btn.active {
                    background: var(--bg-surface);
                    color: var(--primary-color);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    font-weight: 700;
                }
                
                .editor-tab-btn:hover:not(.active) {
                    background: rgba(0,0,0,0.04);
                    color: var(--text-primary);
                }

                .editor-tab-btn .icon-wrapper {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .editor-tab-btn span { font-size: 0.75rem; font-weight: 500; }

                .tab-content { 
                    flex: 1; 
                    padding: 12px 16px; 
                    overflow-y: auto; 
                }

                .tab-content h3 { margin-top: 4px; margin-bottom: 20px; font-size: 1rem; font-weight: 800; color: var(--text-primary); border-left: 4px solid var(--primary-color); padding-left: 12px; line-height: 1.2; }
                .settings-group { margin-bottom: 16px; display: flex; flex-direction: column; }
                .settings-group label { display: block; font-size: 0.75rem; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary); }
                .settings-group input, .settings-group textarea, .settings-group select {
                    width: 100%; padding: 8px 12px; border-radius: 8px;
                    border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-primary);
                    font-size: 0.85rem; transition: border-color 0.2s;
                }
                .settings-group input:focus, .settings-group select:focus { border-color: var(--primary-color); outline: none; }

                .slider-input { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
                .slider-input input[type="range"] { flex: 1; accent-color: var(--primary-color); }
                .slider-input input[type="number"] { width: 65px; text-align: center; padding: 6px; }

                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

                .levels-manager .btn-add-level {
                    width: 100%; padding: 12px; border-radius: 8px; border: 2px dashed var(--border-color);
                    background: transparent; color: var(--text-secondary); cursor: pointer; margin-bottom: 16px;
                }

                .level-item {
                    display: flex; align-items: center; padding: 8px; border-radius: 10px;
                    background: var(--bg-main); border: 1px solid var(--border-color); margin-bottom: 4px;
                    cursor: pointer; transition: all 0.2s;
                }

                .level-item.selected { border-color: var(--primary-color); background: rgba(var(--primary-rgb), 0.05); }
                .level-item .idx { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: var(--bg-surface); border-radius: 50%; font-size: 0.65rem; margin-right: 8px; }
                .level-item .details { flex: 1; }
                .level-item .details strong { display: block; font-size: 0.85rem; }
                .level-item .details span { font-size: 0.7rem; color: var(--text-secondary); }
                .level-item .actions { display: flex; gap: 4px; opacity: 0; }
                .level-item:hover .actions { opacity: 1; }
                .level-item .actions button { border: none; background: transparent; padding: 4px; color: var(--text-secondary); cursor: pointer; }
                .level-item .actions button.delete:hover { color: #ef4444; }

                .concept-section { margin-bottom: 12px; }
                .concept-section h4 { font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px; }
                .concept-row { display: flex; gap: 4px; margin-bottom: 4px; }
                .concept-row input { flex: 1; padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-input); }
                .concept-row button { border: none; background: transparent; color: var(--text-secondary); cursor: pointer; }

                .screen-selector-tabs { display: none; }
                
                .screens-accordion { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
                .level-accordion-item { 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .level-accordion-item.open { 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    margin-bottom: 20px !important;
                }
                .level-accordion-header { 
                    transition: all 0.2s;
                }
                .level-accordion-header:hover { 
                    background: rgba(var(--primary-rgb), 0.08) !important;
                }

                .accordion-item { border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; background: var(--bg-surface); transition: all 0.2s; }
                .accordion-item.open { border-color: var(--primary-color); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                .accordion-header { 
                    padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; 
                    cursor: pointer; background: var(--bg-surface); transition: background 0.2s;
                }
                .accordion-header:hover { background: rgba(0,0,0,0.02); }
                .accordion-header .header-left { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.8rem; color: var(--text-primary); }
                .accordion-header .arrow { transition: transform 0.3s; color: var(--text-secondary); }
                .accordion-header .arrow.up { transform: rotate(180deg); color: var(--primary-color); }
                .accordion-content { padding: 14px; border-top: 1px solid var(--border-color); background: var(--bg-main); }

                .screen-preview-container {
                    width: 100%; height: 100%; border-radius: 8px; position: relative; overflow: hidden;
                    display: flex; align-items: center; justify-content: center;
                }
                .screen-mockup-overlay {
                    width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; flex-direction: column;
                    align-items: center; justify-content: center; text-align: center; color: white; padding: 40px;
                }
                .screen-content h1 { font-size: 2.5rem; margin-bottom: 16px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
                .screen-content p { font-size: 1.1rem; margin-bottom: 32px; max-width: 500px; line-height: 1.6; text-shadow: 0 2px 5px rgba(0,0,0,0.3); }
                .preview-game-btn {
                    padding: 12px 32px; background: var(--primary-color); border: none; border-radius: 30px;
                    color: white; font-weight: 700; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.4);
                }
                .disabled-badge {
                    position: absolute; top: 20px; right: 20px; background: #ef4444; color: white;
                    padding: 4px 12px; border-radius: 4px; font-size: 0.7rem; font-weight: 800;
                }

                .editor-center-panel { flex: 1; background: var(--bg-main); padding: 20px; overflow: hidden; display: flex; flex-direction: column; }
                .preview-container { flex: 1; background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
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

                .editor-right-panel { width: 200px; border-left: 1px solid var(--border-color); background: var(--bg-surface); padding: 12px; }
                .panel-header { font-weight: bold; font-size: 0.85rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
                .summary-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
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
