import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { GameContainer } from '../components/game/GameContainer';
import type { GameProject, LevelData, ConceptData } from '../game/types';
import { 
    Save, Plus, Trash2, Settings as SettingsIcon, Layout, Database, 
    Play, X, ChevronRight, ChevronLeft, Copy, ArrowUp, ArrowDown, Info, 
    Palette, Music, Zap, BarChart2, Globe, Monitor, Trophy, Flag, ChevronDown,
    Beaker, Hash, Sparkles, PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

type EditorTab = 'basics' | 'concepts' | 'rules' | 'visual' | 'publish';
type EditorPhase = 'basics' | 'content' | 'rules' | 'design' | 'publish';

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
        instruction: 'Doğru nesneleri yakala, yanlışlardan kaçın!',
        learning_goal: '',
        background: '',
        correct_concepts: [{ text: 'Doğru Kavram 1', weight: 1, description: '' }],
        wrong_concepts: [{ text: 'Yanlış Kavram 1', weight: 1, description: '' }],
        duration: 60,
        target_score: 50,
        success_percentage: 70,
        max_errors: 3,
        config: {
            spawnRate: 2000,
            gravityY: 300,
            playerSpeed: 600,
            itemSpeed: 200,
            points_correct: 10,
            points_wrong: 5,
            rotation_enabled: false,
            rotation_speed: 3
        },
        screens: createLevelScreens()
    } as any;
}

export const LevelEditor: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const numericRouteId = id ? Number(id) : undefined;
    
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

    // --- Fetch / Update URL ---
    useEffect(() => {
        if (numericRouteId && project.id !== numericRouteId) {
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/levels/${numericRouteId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(r => {
                    if (r.ok) return r.json();
                    throw new Error('Proje bulunamadı');
                })
                .then(data => {
                    if (data) setProject(data);
                })
                .catch(err => console.error(err));
            }
        }
    }, [numericRouteId, project.id]);

    useEffect(() => {
        if (project.id && project.id !== numericRouteId) {
            navigate(`/editor/${project.id}`, { replace: true, state: { projectToLoad: project } });
        }
    }, [project.id, numericRouteId, navigate]);

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
            if (lvl.screens && ('cover' in lvl.screens || 'victory' in lvl.screens || 'defeat' in lvl.screens)) {
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



    const [activeTab, setActiveTab] = useState<EditorTab>('basics');
    const [activePhase, setActivePhase] = useState<EditorPhase>('basics');
    const [activeScreen, setActiveScreen] = useState<'cover' | 'victory' | 'defeat' | 'infoStart' | 'infoEnd' | 'gameplay' | null>('cover');
    const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
    const [isTesting, setIsTesting] = useState(false);
    const [showSummary, setShowSummary] = useState(true);
    const [testMode, setTestMode] = useState<'single' | 'all'>('single');
    const [conceptSearch, setConceptSearch] = useState('');
    const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
    const [sidebarWidth, setSidebarWidth] = useState(460);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isWizardMode, setIsWizardMode] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
    const [bulkConceptModal, setBulkConceptModal] = useState<{
        isOpen: boolean;
        levelIndex: number;
        conceptType: 'correct' | 'wrong';
        value: string;
    }>({
        isOpen: false,
        levelIndex: 0,
        conceptType: 'correct',
        value: ''
    });
    const isResizing = useRef(false);
    
    // Seviye seçildiğinde veya temel ayarlar/kavramlar/kurallar sekmesindeyken 
    // önizlemede otomatik olarak o seviyenin oyun (gameplay) ekranını göster
    useEffect(() => {
        if (activePhase === 'basics' || activePhase === 'content' || activePhase === 'rules') {
            setActiveScreen('gameplay');
        }
    }, [selectedLevelIndex, activePhase]);

    const mainLayoutRef = useRef<HTMLDivElement>(null);
    
    // --- Resizing Logic ---
    const startResizing = useCallback(() => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!isResizing.current || !mainLayoutRef.current) return;
        const rect = mainLayoutRef.current.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        if (newWidth > 340 && newWidth < 760) {
            setSidebarWidth(newWidth);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    const currentLevel = project.data.levels[selectedLevelIndex] || project.data.levels[0];
    const wizardSteps: Array<{ phase: EditorPhase; tab: EditorTab; title: string; description: string }> = [
        { phase: 'basics', tab: 'basics', title: 'Proje Temeli', description: 'Başlık, açıklama, ders ve seviyeleri birlikte netleştir.' },
        { phase: 'content', tab: 'concepts', title: 'Kavram Havuzu', description: 'Doğru ve yanlış kavramları temiz biçimde oluştur.' },
        { phase: 'rules', tab: 'rules', title: 'Oyun Kuralları', description: 'Süre, skor ve başarı eşiklerini ince ayarla.' },
        { phase: 'design', tab: 'visual', title: 'Görünüm ve Ekranlar', description: 'Kapak, ara ekranlar ve medya deneyimini düzenle.' },
        { phase: 'publish', tab: 'publish', title: 'Yayın Kontrolü', description: 'UI stili, yayın görünürlüğü ve son kontrolleri tamamla.' }
    ];

    // --- Fetch Assets ---
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/assets`)
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
                        style={{ width: '100%', minHeight: '44px', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
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
                            style={{ width: '100%', minHeight: '44px', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
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

    const goToEditorStep = (phase: EditorPhase, tab: EditorTab) => {
        setActivePhase(phase);
        setActiveTab(tab);
    };

    const startWizard = () => {
        setIsWizardMode(true);
        setWizardStep(0);
        goToEditorStep(wizardSteps[0].phase, wizardSteps[0].tab);
    };

    const stopWizard = () => {
        setIsWizardMode(false);
    };

    const goToWizardStep = (index: number) => {
        const nextStep = wizardSteps[index];
        setWizardStep(index);
        goToEditorStep(nextStep.phase, nextStep.tab);
    };

    const openBulkConceptModal = (levelIndex: number, conceptType: 'correct' | 'wrong') => {
        setBulkConceptModal({
            isOpen: true,
            levelIndex,
            conceptType,
            value: ''
        });
        setSelectedLevelIndex(levelIndex);
    };

    const applyBulkConcepts = () => {
        const items = bulkConceptModal.value
            .split(/[\n,]/)
            .map(item => item.trim())
            .filter(Boolean)
            .map(text => ({ text, weight: 1 }));

        if (!items.length) {
            setBulkConceptModal(prev => ({ ...prev, isOpen: false, value: '' }));
            return;
        }

        const targetLevel = project.data.levels[bulkConceptModal.levelIndex];
        if (!targetLevel) {
            setBulkConceptModal(prev => ({ ...prev, isOpen: false, value: '' }));
            return;
        }

        const key = bulkConceptModal.conceptType === 'correct' ? 'correct_concepts' : 'wrong_concepts';
        const updatedLevels = [...project.data.levels];
        updatedLevels[bulkConceptModal.levelIndex] = {
            ...targetLevel,
            [key]: [...targetLevel[key], ...items]
        };

        setProject({
            ...project,
            data: {
                ...project.data,
                levels: updatedLevels
            }
        });
        setBulkConceptModal(prev => ({ ...prev, isOpen: false, value: '' }));
    };

    const applyPhysicalQuantitiesTemplate = () => {
        const levels: LevelData[] = [
            {
                id: crypto.randomUUID(),
                title: 'Temel Büyüklükler',
                instruction: 'Yalnızca temel büyüklükleri yakala!',
                background: '',
                correct_concepts: [
                    { text: 'Uzunluk', weight: 1, description: '' },
                    { text: 'Kütle', weight: 1, description: '' },
                    { text: 'Zaman', weight: 1, description: '' },
                    { text: 'Sıcaklık', weight: 1, description: '' },
                    { text: 'Akım Şiddeti', weight: 1, description: '' }
                ],
                wrong_concepts: [
                    { text: 'Hız', weight: 1, description: '' },
                    { text: 'Kuvvet', weight: 1, description: '' },
                    { text: 'Enerji', weight: 1, description: '' }
                ],
                duration: 60, target_score: 50, success_percentage: 70, max_errors: 3,
                config: { spawnRate: 1500, gravityY: 300, playerSpeed: 600, itemSpeed: 200, points_correct: 10, points_wrong: 5, rotation_enabled: false, rotation_speed: 3 },
                screens: createLevelScreens()
            },
            {
                id: crypto.randomUUID(),
                title: 'Türetilmiş Büyüklükler',
                instruction: 'Yalnızca türetilmiş büyüklükleri yakala!',
                background: '',
                correct_concepts: [
                    { text: 'Hız', weight: 1, description: '' },
                    { text: 'İvme', weight: 1, description: '' },
                    { text: 'Kuvvet', weight: 1, description: '' },
                    { text: 'Enerji', weight: 1, description: '' }
                ],
                wrong_concepts: [
                    { text: 'Uzunluk', weight: 1, description: '' },
                    { text: 'Zaman', weight: 1, description: '' },
                    { text: 'Kütle', weight: 1, description: '' }
                ],
                duration: 60, target_score: 60, success_percentage: 70, max_errors: 3,
                config: { spawnRate: 1400, gravityY: 350, playerSpeed: 600, itemSpeed: 220, points_correct: 10, points_wrong: 5, rotation_enabled: false, rotation_speed: 3 },
                screens: createLevelScreens()
            }
        ];
        
        setProject({
            ...project,
            title: 'Fiziksel Büyüklükler',
            description: 'Temel ve türetilmiş büyüklükleri ayırt etmeyi öğreten oyun.',
            data: { ...project.data, levels }
        });
        setSelectedLevelIndex(0);
    };

    const applyChemistryTemplate = () => {
        const levels: LevelData[] = [
            {
                id: crypto.randomUUID(),
                title: 'Elementler',
                instruction: 'Yalnızca element sembollerini yakala!',
                background: '',
                correct_concepts: [
                    { text: 'H', weight: 1, description: 'Hidrojen' },
                    { text: 'He', weight: 1, description: 'Helyum' },
                    { text: 'Li', weight: 1, description: 'Lityum' },
                    { text: 'O', weight: 1, description: 'Oksijen' },
                    { text: 'Au', weight: 1, description: 'Altın' }
                ],
                wrong_concepts: [
                    { text: 'H2O', weight: 1, description: 'Su' },
                    { text: 'CO2', weight: 1, description: 'Karbondioksit' },
                    { text: 'NaCl', weight: 1, description: 'Tuz' }
                ],
                duration: 60, target_score: 50, success_percentage: 70, max_errors: 3,
                config: { spawnRate: 1500, gravityY: 300, playerSpeed: 600, itemSpeed: 200, points_correct: 10, points_wrong: 5, rotation_enabled: false, rotation_speed: 3 },
                screens: createLevelScreens()
            },
            {
                id: crypto.randomUUID(),
                title: 'Bileşikler',
                instruction: 'Yalnızca bileşik formüllerini yakala!',
                background: '',
                correct_concepts: [
                    { text: 'H2O', weight: 1, description: 'Su' },
                    { text: 'CO2', weight: 1, description: 'Karbondioksit' },
                    { text: 'NH3', weight: 1, description: 'Amonyak' },
                    { text: 'CH4', weight: 1, description: 'Metan' }
                ],
                wrong_concepts: [
                    { text: 'Fe', weight: 1, description: 'Demir' },
                    { text: 'Cu', weight: 1, description: 'Bakır' },
                    { text: 'Ag', weight: 1, description: 'Gümüş' }
                ],
                duration: 60, target_score: 60, success_percentage: 70, max_errors: 3,
                config: { spawnRate: 1400, gravityY: 350, playerSpeed: 600, itemSpeed: 220, points_correct: 10, points_wrong: 5, rotation_enabled: false, rotation_speed: 3 },
                screens: createLevelScreens()
            }
        ];
        
        setProject({
            ...project,
            title: 'Kimya: Elementler ve Bileşikler',
            description: 'Kimyasal sembolleri ve formülleri tanıma oyunu.',
            data: { ...project.data, levels }
        });
        setSelectedLevelIndex(0);
    };

    const applyMathTemplate = () => {
        const levels: LevelData[] = [
            {
                id: crypto.randomUUID(),
                title: 'Asal Sayılar',
                instruction: 'Yalnızca asal sayıları yakala!',
                background: '',
                correct_concepts: [
                    { text: '2', weight: 1, description: '' },
                    { text: '3', weight: 1, description: '' },
                    { text: '5', weight: 1, description: '' },
                    { text: '7', weight: 1, description: '' },
                    { text: '11', weight: 1, description: '' },
                    { text: '13', weight: 1, description: '' }
                ],
                wrong_concepts: [
                    { text: '4', weight: 1, description: '' },
                    { text: '6', weight: 1, description: '' },
                    { text: '8', weight: 1, description: '' },
                    { text: '9', weight: 1, description: '' },
                    { text: '10', weight: 1, description: '' }
                ],
                duration: 45, target_score: 40, success_percentage: 80, max_errors: 3,
                config: { spawnRate: 1200, gravityY: 320, playerSpeed: 700, itemSpeed: 250, points_correct: 10, points_wrong: 5, rotation_enabled: false },
                screens: createLevelScreens()
            }
        ];
        
        setProject({
            ...project,
            title: 'Matematik: Asal Sayılar',
            description: 'Sayılar arasından asalları seçme hızı testi.',
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
            const url = project.id ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/levels/${project.id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/levels`;
            
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
                // Set first tab of phase as active
                if (id === 'basics') goToEditorStep('basics', 'basics');
                if (id === 'content') goToEditorStep('content', 'concepts');
                if (id === 'rules') goToEditorStep('rules', 'rules');
                if (id === 'design') goToEditorStep('design', 'visual');
                if (id === 'publish') goToEditorStep('publish', 'publish');
                if (isWizardMode) {
                    const matchingIndex = wizardSteps.findIndex(step => step.phase === id);
                    if (matchingIndex >= 0) {
                        setWizardStep(matchingIndex);
                    }
                }
            }}
            className={`phase-btn ${activePhase === id ? 'active' : ''}`}
        >
            {label}
        </button>
    );

    const renderPhaseNav = () => (
        <div className="phase-nav">
            {renderPhaseButton('basics', '1. Başlangıç')}
            {renderPhaseButton('content', '2. İçerik')}
            {renderPhaseButton('rules', '3. Kurallar')}
            {renderPhaseButton('design', '4. Tasarım & Ekranlar')}
            {renderPhaseButton('publish', '5. Yayın')}
        </div>
    );

    return (
        <MainLayout>
            <div className="editor-container editor-ui-scope">
                {/* Slim Header Area */}
                <header className="editor-header">
                    <div className="header-left">
                        <div className="project-meta">
                            <span className="status-badge">{project.status}</span>
                            <h1 title={project.title}>{project.title}</h1>
                        </div>
                        {renderPhaseNav()}
                    </div>
                    <div className="header-actions">
                        <button
                            className={`btn-wizard ${isWizardMode ? 'active' : ''}`}
                            onClick={() => (isWizardMode ? stopWizard() : startWizard())}
                            title="İstek üzerine adım adım rehber"
                        >
                            <Sparkles size={16} /> {isWizardMode ? 'Wizardı Kapat' : 'Wizardı Başlat'}
                        </button>
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

                <div className="editor-main-layout" ref={mainLayoutRef}>
                    {/* LEFT PANEL: Settings */}
                    <aside 
                        className={`editor-left-panel ${isSidebarCollapsed ? 'collapsed' : ''}`} 
                        style={{ width: isSidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
                    >
                        <div className="panel-toggle-tab" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </div>

                        {!isSidebarCollapsed && (
                            <>
                                <nav className="editor-tabs vertical">
                                    {activePhase === 'basics' && renderTabButton('basics', 'Proje Kimliği', <Info size={18} />)}
                                    {activePhase === 'content' && renderTabButton('concepts', 'Kavram Havuzu', <Database size={18} />)}
                                    {activePhase === 'rules' && renderTabButton('rules', 'Oyun Dinamiği', <Zap size={18} />)}
                                    {activePhase === 'design' && renderTabButton('visual', 'Tasarım & Ekranlar', <Palette size={18} />)}
                                    {activePhase === 'publish' && renderTabButton('publish', 'Yayın Ayarları', <Globe size={18} />)}
                                </nav>

                                <div className="tab-content">
                            {isWizardMode && (
                                <div className="wizard-banner">
                                    <div className="wizard-banner-top">
                                        <div>
                                            <div className="wizard-kicker">Adım Adım Kurulum</div>
                                            <h3>{wizardSteps[wizardStep].title}</h3>
                                            <p>{wizardSteps[wizardStep].description}</p>
                                        </div>
                                        <button className="wizard-close-btn" onClick={stopWizard}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="wizard-progress">
                                        {wizardSteps.map((step, index) => (
                                            <button
                                                key={step.title}
                                                className={`wizard-progress-dot ${index === wizardStep ? 'active' : ''} ${index < wizardStep ? 'done' : ''}`}
                                                onClick={() => goToWizardStep(index)}
                                                title={step.title}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="wizard-actions">
                                        <button
                                            className="wizard-nav-btn"
                                            onClick={() => goToWizardStep(Math.max(0, wizardStep - 1))}
                                            disabled={wizardStep === 0}
                                        >
                                            Geri
                                        </button>
                                        <button
                                            className="wizard-nav-btn primary"
                                            onClick={() => {
                                                if (wizardStep === wizardSteps.length - 1) {
                                                    stopWizard();
                                                    return;
                                                }
                                                goToWizardStep(wizardStep + 1);
                                            }}
                                        >
                                            {wizardStep === wizardSteps.length - 1 ? 'Tamamla' : 'Sonraki Adım'}
                                        </button>
                                    </div>
                                </div>
                            )}
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
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`}>
                                                <div className="level-accordion-header" onClick={() => setSelectedLevelIndex(idx)}>
                                                    <div className="header-left">
                                                        <span className="lvl-badge">{idx + 1}</span>
                                                        <strong>{lvl.title}</strong>
                                                    </div>
                                                    <div className="header-right">
                                                        <span className="count-tag">{lvl.correct_concepts.length} Doğru</span>
                                                        <span className="count-tag wrong">{lvl.wrong_concepts.length} Yanlış</span>
                                                        <ChevronDown size={18} />
                                                    </div>
                                                </div>

                                                {isLevelOpen && (
                                                    <div className="accordion-body">
                                                        <div className="settings-group">
                                                            <label>Öğrenme Kazanımı (Açıklama)</label>
                                                            <input 
                                                                placeholder="Bu seviyede öğrenci neyi öğrenecek?" 
                                                                value={lvl.learning_goal || ''} 
                                                                onChange={e => updateCurrentLevel({ learning_goal: e.target.value })} 
                                                            />
                                                        </div>

                                                        <div className="grid-2">
                                                            <div className="concept-card success">
                                                                <div className="card-header">
                                                                    <h4>✅ Doğru Kavramlar</h4>
                                                                    <button onClick={() => openBulkConceptModal(idx, 'correct')}>Toplu Giriş</button>
                                                                </div>
                                                                <div className="concept-rows">
                                                                    {lvl.correct_concepts.map((c, i) => (
                                                                        <div key={i} className="concept-input-row">
                                                                            <input value={c.text} onChange={e => {
                                                                                const newList = [...lvl.correct_concepts];
                                                                                newList[i].text = e.target.value;
                                                                                updateCurrentLevel({ correct_concepts: newList });
                                                                            }} />
                                                                            <button onClick={() => {
                                                                                updateCurrentLevel({ correct_concepts: lvl.correct_concepts.filter((_, ci) => ci !== i) });
                                                                            }}><Trash2 size={14} /></button>
                                                                        </div>
                                                                    ))}
                                                                    <button className="btn-add-concept" onClick={() => updateCurrentLevel({ correct_concepts: [...lvl.correct_concepts, { text: '', weight: 1 }] })}>+ Ekle</button>
                                                                </div>
                                                            </div>

                                                            <div className="concept-card danger">
                                                                <div className="card-header">
                                                                    <h4>❌ Yanlış Kavramlar</h4>
                                                                    <button onClick={() => openBulkConceptModal(idx, 'wrong')}>Toplu Giriş</button>
                                                                </div>
                                                                <div className="concept-rows">
                                                                    {lvl.wrong_concepts.map((c, i) => (
                                                                        <div key={i} className="concept-input-row">
                                                                            <input value={c.text} onChange={e => {
                                                                                const newList = [...lvl.wrong_concepts];
                                                                                newList[i].text = e.target.value;
                                                                                updateCurrentLevel({ wrong_concepts: newList });
                                                                            }} />
                                                                            <button onClick={() => {
                                                                                updateCurrentLevel({ wrong_concepts: lvl.wrong_concepts.filter((_, ci) => ci !== i) });
                                                                            }}><Trash2 size={14} /></button>
                                                                        </div>
                                                                    ))}
                                                                    <button className="btn-add-concept" onClick={() => updateCurrentLevel({ wrong_concepts: [...lvl.wrong_concepts, { text: '', weight: 1 }] })}>+ Ekle</button>
                                                                </div>
                                                            </div>
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
                                                                    <div className="grid-2">
                                                                        <div className="settings-group">
                                                                            <label>Başlık</label>
                                                                            <input value={screenData.title} onChange={e => setProject({...project, data: {...project.data, common_screens: {...project.data.common_screens!, [s.id]: {...screenData, title: e.target.value}}}})} />
                                                                            <label>Açıklama</label>
                                                                            <textarea rows={2} value={screenData.description} onChange={e => setProject({...project, data: {...project.data, common_screens: {...project.data.common_screens!, [s.id]: {...screenData, description: e.target.value}}}})} />
                                                                        </div>
                                                                        <div className="settings-group">
                                                                            <label>Buton Metni</label>
                                                                            <input value={screenData.buttonText} onChange={e => setProject({...project, data: {...project.data, common_screens: {...project.data.common_screens!, [s.id]: {...screenData, buttonText: e.target.value}}}})} />
                                                                            <AssetPicker type="background" label="Özel Arka Plan" value={(screenData as any).background || ''} onChange={val => setProject({...project, data: {...project.data, common_screens: {...project.data.common_screens!, [s.id]: {...screenData, background: val}}}})} />
                                                                        </div>
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
                                    <h4 style={{ fontSize: '0.8rem', margin: '0 0 12px 4px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seviye Tasarımı & Ekranları</h4>
                                    {project.data.levels.map((lvl, idx) => {
                                        const isLevelOpen = selectedLevelIndex === idx;
                                        return (
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`}>
                                                <div className="level-accordion-header" onClick={() => setSelectedLevelIndex(idx)}>
                                                    <div className="header-left">
                                                        <span className="lvl-badge">{idx + 1}</span>
                                                        <strong>{lvl.title}</strong>
                                                    </div>
                                                    <ChevronDown size={18} />
                                                </div>

                                                {isLevelOpen && (
                                                    <div className="accordion-body">
                                                        <div className="screens-accordion">
                                                            {/* 1. GÖRÜNÜM & MEDYA */}
                                                            <div className={`accordion-item ${activeScreen === 'gameplay' ? 'open' : ''}`}>
                                                                <div className="accordion-header" onClick={() => setActiveScreen(activeScreen === 'gameplay' ? null : 'gameplay')}>
                                                                    <div className="header-left"><Palette size={18} /> <span>Görünüm & Medya</span></div>
                                                                    <ChevronDown size={16} className={`arrow ${activeScreen === 'gameplay' ? 'up' : ''}`} />
                                                                </div>
                                                                {activeScreen === 'gameplay' && (
                                                                    <div className="accordion-content">
                                                                        <div className="grid-2">
                                                                            <div className="settings-card">
                                                                                <h4>🖼️ Görseller</h4>
                                                                                <AssetPicker type="background" label="Arka Plan" value={lvl.background} onChange={val => updateCurrentLevel({ background: val })} />
                                                                                <AssetPicker type="spritesheet" label="Karakter / Sepet" value={lvl.config.player_image || ''} onChange={val => updateCurrentLevel({ config: { ...lvl.config, player_image: val } })} />
                                                                            </div>
                                                                            <div className="settings-card">
                                                                                <h4>🎵 Sesler</h4>
                                                                                <AssetPicker type="music" label="Arka Plan Müziği" value={lvl.music_url || ''} onChange={val => updateCurrentLevel({ music_url: val })} />
                                                                                <div className="grid-2">
                                                                                    <AssetPicker type="sound" label="Doğru Sesi" value={lvl.config.sound_correct || ''} onChange={val => updateCurrentLevel({ config: { ...lvl.config, sound_correct: val } })} />
                                                                                    <AssetPicker type="sound" label="Hata Sesi" value={lvl.config.sound_wrong || ''} onChange={val => updateCurrentLevel({ config: { ...lvl.config, sound_wrong: val } })} />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid-2" style={{ marginTop: '12px' }}>
                                                                            <div className="settings-group">
                                                                                <label>Doğru Yakalama Efekti</label>
                                                                                <select value={lvl.effect_correct || 'sparkle'} onChange={e => updateCurrentLevel({ effect_correct: e.target.value })}>
                                                                                    <option value="sparkle">Parlama (Sparkle)</option>
                                                                                    <option value="glow">Işıma (Glow)</option>
                                                                                    <option value="pop">Büyüme (Pop)</option>
                                                                                </select>
                                                                            </div>
                                                                            <div className="settings-group">
                                                                                <label>Hata Efekti</label>
                                                                                <select value={lvl.effect_wrong || 'shake'} onChange={e => updateCurrentLevel({ effect_wrong: e.target.value })}>
                                                                                    <option value="shake">Sarsıntı (Shake)</option>
                                                                                    <option value="tint">Flaş (Flash)</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* 2. BİLGİ EKRANLARI */}
                                                            {[
                                                                { id: 'infoStart', label: 'Başlangıç Bilgi Ekranı', icon: <Info size={18} /> },
                                                                { id: 'infoEnd', label: 'Bitiş Bilgi Ekranı', icon: <Flag size={18} /> }
                                                            ].map(s => {
                                                                const screenData = (lvl.screens as any)?.[s.id];
                                                                const isOpen = activeScreen === s.id;
                                                                if (!screenData) return null;
                                                                
                                                                return (
                                                                    <div key={s.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
                                                                        <div className="accordion-header" onClick={() => setActiveScreen(isOpen ? null : s.id as any)}>
                                                                            <div className="header-left">{s.icon} <span>{s.label}</span></div>
                                                                            <ChevronDown size={16} className={`arrow ${isOpen ? 'up' : ''}`} />
                                                                        </div>
                                                                        {isOpen && (
                                                                            <div className="accordion-content">
                                                                                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                                                                    <input type="checkbox" checked={screenData.enabled} onChange={e => {
                                                                                        const newScreens = { ...lvl.screens };
                                                                                        (newScreens as any)[s.id].enabled = e.target.checked;
                                                                                        updateCurrentLevel({ screens: newScreens });
                                                                                    }} />
                                                                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Bu ekranı aktifleştir</span>
                                                                                </div>
                                                                                <div className="grid-2">
                                                                                    <div className="settings-group">
                                                                                        <label>Başlık</label>
                                                                                        <input value={screenData.title} onChange={e => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].title = e.target.value;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }} />
                                                                                        <label>Açıklama</label>
                                                                                        <textarea rows={2} value={screenData.description} onChange={e => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].description = e.target.value;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }} />
                                                                                    </div>
                                                                                    <div className="settings-group">
                                                                                        <label>Buton Metni</label>
                                                                                        <input value={screenData.buttonText} onChange={e => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].buttonText = e.target.value;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }} />
                                                                                        <AssetPicker type="background" label="Özel Arka Plan" value={screenData.background || ''} onChange={val => {
                                                                                            const newScreens = { ...lvl.screens };
                                                                                            (newScreens as any)[s.id].background = val;
                                                                                            updateCurrentLevel({ screens: newScreens });
                                                                                        }} />
                                                                                    </div>
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

                            {activeTab === 'rules' && (
                                <div className="level-accordions-container">
                                    {project.data.levels.map((lvl, idx) => {
                                        const isLevelOpen = selectedLevelIndex === idx;
                                        return (
                                            <div key={lvl.id} className={`level-accordion-item ${isLevelOpen ? 'open' : ''}`}>
                                                <div className="level-accordion-header" onClick={() => setSelectedLevelIndex(idx)}>
                                                    <div className="header-left">
                                                        <span className="lvl-badge">{idx + 1}</span>
                                                        <strong>{lvl.title} - Kurallar</strong>
                                                    </div>
                                                    <ChevronDown size={18} />
                                                </div>

                                                {isLevelOpen && (
                                                    <div className="accordion-body">
                                                        <div className="grid-2">
                                                            <div className="settings-card">
                                                                <h4>⚖️ Zorluk & Akış</h4>
                                                                <div className="settings-group">
                                                                    <label>Seviye Süresi (Saniye)</label>
                                                                    <div className="slider-input">
                                                                        <input type="range" min="10" max="300" step="10" value={lvl.duration} onChange={e => updateCurrentLevel({ duration: parseInt(e.target.value) })} />
                                                                        <span className="val-preview">{lvl.duration}s</span>
                                                                    </div>
                                                                </div>
                                                                <div className="settings-group">
                                                                    <label>Düşme Hızı</label>
                                                                    <div className="slider-input">
                                                                        <input type="range" min="50" max="800" step="50" value={lvl.config.itemSpeed} onChange={e => updateCurrentLevel({ config: { ...lvl.config, itemSpeed: parseInt(e.target.value) } })} />
                                                                        <span className="val-preview">{lvl.config.itemSpeed}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="settings-group">
                                                                    <label>Maksimum Hata Hakkı</label>
                                                                    <div className="slider-input">
                                                                        <input type="range" min="1" max="10" step="1" value={lvl.max_errors || 3} onChange={e => updateCurrentLevel({ max_errors: parseInt(e.target.value) })} />
                                                                        <span className="val-preview">{lvl.max_errors || 3}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="settings-card">
                                                                <h4>🎯 Başarı Kriterleri</h4>
                                                                <div className="settings-group">
                                                                    <label>Hedef Skor</label>
                                                                    <div className="slider-input">
                                                                        <input type="range" min="10" max="1000" step="10" value={lvl.target_score} onChange={e => updateCurrentLevel({ target_score: parseInt(e.target.value) })} />
                                                                        <span className="val-preview">{lvl.target_score}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="settings-group">
                                                                    <label>Doğruluk Eşiği (%)</label>
                                                                    <div className="slider-input">
                                                                        <input type="range" min="10" max="100" step="5" value={lvl.success_percentage} onChange={e => updateCurrentLevel({ success_percentage: parseInt(e.target.value) })} />
                                                                        <span className="val-preview">%{lvl.success_percentage}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="grid-2" style={{ marginTop: '12px' }}>
                                                                    <div className="settings-group">
                                                                        <label>Doğru Puanı</label>
                                                                        <input type="number" value={lvl.config.points_correct || 10} onChange={e => updateCurrentLevel({ config: { ...lvl.config, points_correct: parseInt(e.target.value) } })} />
                                                                    </div>
                                                                    <div className="settings-group">
                                                                        <label>Yanlış Cezası</label>
                                                                        <input type="number" value={lvl.config.points_wrong || 5} onChange={e => updateCurrentLevel({ config: { ...lvl.config, points_wrong: parseInt(e.target.value) } })} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'publish' && (
                                <div className="publish-container">
                                    <div className="grid-2">
                                        <div className="settings-group">
                                            <h3>Sistem & Görünüm</h3>
                                            <label>Oyun Bilgi Paneli Stili (UI)</label>
                                            <select 
                                                value={project.data.settings.ui_style || 'classic'} 
                                                onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, ui_style: e.target.value as any}}})}
                                                style={{ border: '1px solid var(--primary-color)', background: 'rgba(var(--primary-rgb), 0.05)' }}
                                            >
                                                <option value="classic">Klasik (Üst Bar)</option>
                                                <option value="modern">Modern (Köşe Kartları)</option>
                                                <option value="minimal">Minimal (Sadece İkonlar)</option>
                                                <option value="gaming">Oyuncu (Gelişmiş Panel)</option>
                                            </select>

                                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={project.data.settings.showLeaderboard} 
                                                        onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, showLeaderboard: e.target.checked}}})} 
                                                    />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Liderlik Tablosunu Göster</span>
                                                </label>

                                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={project.data.settings.allowRetries} 
                                                        onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, allowRetries: e.target.checked}}})} 
                                                    />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Tekrar Denemeye İzin Ver</span>
                                                </label>
                                            </div>

                                            <label style={{ marginTop: '16px' }}>Bitiş Mesajı (Tebrikler Mesajı)</label>
                                            <input value={project.data.settings.completion_message || ''} onChange={e => setProject({...project, data: {...project.data, settings: {...project.data.settings, completion_message: e.target.value}}})} />
                                        </div>

                                        <div className="settings-group">
                                            <h3>Yayınlama</h3>
                                            <label>Görünürlük</label>
                                            <select value={project.visibility} onChange={e => setProject({...project, visibility: e.target.value as any})}>
                                                <option value="public">Herkese Açık</option>
                                                <option value="private">Özel</option>
                                                <option value="school">Okul İçi</option>
                                                <option value="class">Sınıf İçi</option>
                                            </select>

                                            <label>Proje Durumu</label>
                                            <select value={project.status} onChange={e => setProject({...project, status: e.target.value as any})}>
                                                <option value="draft">Taslak</option>
                                                <option value="published">Yayında</option>
                                                <option value="archived">Arşivlendi</option>
                                            </select>

                                            <div className="info-box" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px', marginTop: '24px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                <h4 style={{ margin: '0 0 8px 0', color: '#1d4ed8' }}>Yayınlamaya Hazır mısın?</h4>
                                                <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-primary)' }}>
                                                    Tüm seviyeleri kontrol ettiysen ve ayarlarından eminsen oyunu yayınlayabilirsin. 
                                                    Yayınlanan oyunlar öğrenci panellerinde görünecektir.
                                                </p>
                                                <button className="btn-test w-full" style={{ marginTop: '16px', background: '#1d4ed8' }} onClick={() => { setTestMode('all'); setIsTesting(true); }}>
                                                    <Play size={16} /> Son Kontrol (Önizleme)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        </>
                        )}
                    </aside>

                    {!isSidebarCollapsed && (
                        <div className="resize-handle" onMouseDown={startResizing} />
                    )}

                    {/* CENTER PANEL: Live Preview */}
                    <main className="editor-center-panel">
                        <div className="preview-container">
                            <div className="preview-toolbar">
                                <span>
                                    Canlı Önizleme: {(() => {
                                        switch (activeScreen) {
                                            case 'cover':
                                                return 'Kapak Sayfası';
                                            case 'victory':
                                                return 'Zafer Ekranı';
                                            case 'defeat':
                                                return 'Yenilgi Ekranı';
                                            case 'infoStart':
                                                return `Giriş Ekranı (${currentLevel.title})`;
                                            case 'infoEnd':
                                                return `Özet Ekranı (${currentLevel.title})`;
                                            case 'gameplay':
                                            default:
                                                return `Oyun Ekranı (${currentLevel.title})`;
                                        }
                                    })()}
                                </span>
                                <button onClick={() => { setTestMode('single'); setIsTesting(true); }}>
                                    <Play size={14} /> Seviyeyi Dene
                                </button>
                            </div>
                            <div className="phaser-preview-placeholder">
                                {(['cover', 'victory', 'defeat', 'infoStart', 'infoEnd'].includes(activeScreen || '')) ? (
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
                                            <div className="hearts" style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.6)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                                                {'❤️'.repeat(currentLevel.max_errors || 3)}
                                            </div>
                                        </div>
                                        <div className="instruction" style={{ top: '80px' }}>{currentLevel.instruction}</div>
                                        <div className="objects-preview">
                                            {currentLevel.correct_concepts.slice(0, 2).map((c, i) => (
                                                <div key={i} className="falling-item" style={{ 
                                                    top: `${140 + i * 100}px`, 
                                                    left: `${25 + i * 40}%`, 
                                                    borderLeft: '4px solid #10b981' 
                                                }}>
                                                    {c.text}
                                                </div>
                                            ))}
                                            {currentLevel.wrong_concepts.slice(0, 1).map((c, i) => (
                                                <div key={i} className="falling-item" style={{ 
                                                    top: `${200}px`, 
                                                    left: '70%', 
                                                    borderLeft: '4px solid #ef4444' 
                                                }}>
                                                    {c.text}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="player-preview" style={{ 
                                            background: currentLevel.config.player_image ? `url(${currentLevel.config.player_image}) center/contain no-repeat` : '#6366f1',
                                            width: '100px',
                                            height: '60px',
                                            bottom: '30px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            borderRadius: '8px'
                                        }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>

                    {/* RIGHT PANEL: Info & Checks */}
                    {showSummary && (
                        <aside className={`editor-right-panel ${isSummaryCollapsed ? 'collapsed' : ''}`}>
                            <div className="panel-header">
                                <div className="panel-header-title">
                                    <Info size={16} /> {!isSummaryCollapsed && 'Durum Özeti'}
                                </div>
                                <button
                                    className="panel-collapse-btn"
                                    onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                                    title={isSummaryCollapsed ? 'Özeti Genişlet' : 'Özeti Daralt'}
                                >
                                    {isSummaryCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
                                </button>
                            </div>
                            {!isSummaryCollapsed && (
                                <>
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
                                        <button className="btn-template" onClick={applyPhysicalQuantitiesTemplate}>
                                            <Zap size={14} /> Fiziksel Büyüklükler
                                        </button>
                                        <button className="btn-template" onClick={applyChemistryTemplate}>
                                            <Beaker size={14} /> Elementler & Bileşikler
                                        </button>
                                        <button className="btn-template" onClick={applyMathTemplate}>
                                            <Hash size={14} /> Asal Sayılar (Matematik)
                                        </button>
                                    </div>
                                </>
                            )}
                            {isSummaryCollapsed && (
                                <div className="summary-collapsed-stack">
                                    <div className="summary-mini-pill">{project.data.levels.length}</div>
                                    <div className="summary-mini-pill">{currentLevel.correct_concepts.length}/{currentLevel.wrong_concepts.length}</div>
                                    <div className="summary-mini-pill">{currentLevel.target_score}</div>
                                </div>
                            )}
                        </aside>
                    )}
                </div>

                {/* Full Screen Test Modal */}
                {isTesting && (
                    <div className="test-modal">
                        <div className="modal-content">
                            <GameContainer 
                                projectData={project} 
                                levelIndex={testMode === 'single' ? selectedLevelIndex : 0} 
                                isTestMode={true} 
                                onClose={() => setIsTesting(false)}
                            />
                        </div>
                    </div>
                )}

                {bulkConceptModal.isOpen && (
                    <div className="bulk-modal-backdrop" onClick={() => setBulkConceptModal(prev => ({ ...prev, isOpen: false }))}>
                        <div className="bulk-modal" onClick={(event) => event.stopPropagation()}>
                            <div className="bulk-modal-header">
                                <div>
                                    <div className="wizard-kicker">Toplu Kavram Girişi</div>
                                    <h3>{bulkConceptModal.conceptType === 'correct' ? 'Doğru Kavramları Ekle' : 'Yanlış Kavramları Ekle'}</h3>
                                    <p>Her satıra bir kavram yazabilir ya da virgülle ayırabilirsin.</p>
                                </div>
                                <button className="wizard-close-btn" onClick={() => setBulkConceptModal(prev => ({ ...prev, isOpen: false }))}>
                                    <X size={14} />
                                </button>
                            </div>
                            <textarea
                                className="bulk-textarea"
                                placeholder="Örn:\nKuvvet\nİvme\nSürtünme"
                                value={bulkConceptModal.value}
                                onChange={(event) => setBulkConceptModal(prev => ({ ...prev, value: event.target.value }))}
                            />
                            <div className="bulk-modal-actions">
                                <button className="wizard-nav-btn" onClick={() => setBulkConceptModal(prev => ({ ...prev, isOpen: false }))}>
                                    Vazgeç
                                </button>
                                <button className="wizard-nav-btn primary" onClick={applyBulkConcepts}>
                                    Kavramları Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .editor-container.editor-ui-scope {
                    height: calc(100vh - 64px);
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-main);
                    color: var(--text-primary);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    overflow: hidden;
                }

                .editor-ui-scope button, 
                .editor-ui-scope input, 
                .editor-ui-scope select, 
                .editor-ui-scope textarea {
                    font-family: 'Inter', sans-serif;
                }

                /* Slim Header Styles */
                .editor-header {
                    min-height: 64px;
                    padding: 10px 18px;
                    background: linear-gradient(180deg, rgba(var(--bg-surface-rgb), 1), rgba(var(--bg-surface-rgb), 0.94));
                    border-bottom: 1px solid rgba(var(--primary-rgb), 0.12);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
                    z-index: 100;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-width: 0;
                    flex-wrap: wrap;
                }
                .project-meta {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }
                .project-meta h1 {
                    font-size: 1rem;
                    font-weight: 800;
                    margin: 0;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 280px;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 10px;
                    border-radius: 999px;
                    background: rgba(var(--primary-rgb), 0.1);
                    color: var(--primary-color);
                    font-size: 0.72rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                .phase-nav {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    background: rgba(var(--primary-rgb), 0.06);
                    padding: 6px;
                    border-radius: 14px;
                    border: 1px solid rgba(var(--primary-rgb), 0.08);
                }
                .phase-btn {
                    padding: 8px 12px;
                    font-size: 0.76rem;
                    border-radius: 10px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.2s ease;
                    font-weight: 700;
                }
                .phase-btn.active {
                    background: var(--bg-surface);
                    color: var(--primary-color);
                    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.1);
                }
                .header-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
                .btn-save,
                .btn-test,
                .btn-wizard,
                .btn-exit,
                .btn-icon,
                .preview-toolbar button {
                    min-height: 40px;
                    border-radius: 12px;
                    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
                }
                .btn-save {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
                    color: white;
                    border: none;
                    padding: 0 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 700;
                    font-size: 0.82rem;
                    box-shadow: 0 10px 24px rgba(var(--primary-rgb), 0.28);
                }
                .btn-test {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
                    color: white;
                    border: none;
                    padding: 0 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 700;
                    font-size: 0.82rem;
                }
                .btn-wizard {
                    background: rgba(var(--primary-rgb), 0.08);
                    color: var(--primary-color);
                    border: 1px solid rgba(var(--primary-rgb), 0.16);
                    padding: 0 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 700;
                    font-size: 0.82rem;
                }
                .btn-wizard.active {
                    background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.18), rgba(var(--primary-rgb), 0.08));
                }
                .btn-exit {
                    background: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                    width: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .btn-icon {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                    width: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .btn-icon.active { color: var(--primary-color); border-color: rgba(var(--primary-rgb), 0.4); }
                .btn-save:hover, .btn-test:hover, .btn-exit:hover, .btn-icon:hover, .preview-toolbar button:hover {
                    transform: translateY(-1px);
                }

                .editor-main-layout { flex: 1; display: flex; overflow: hidden; position: relative; }

                .editor-left-panel {
                    background:
                        linear-gradient(180deg, rgba(var(--bg-surface-rgb), 0.98), rgba(var(--bg-surface-rgb), 0.93)),
                        radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.08), transparent 35%);
                    border-right: 1px solid rgba(var(--primary-rgb), 0.14);
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    transition: width 0.1s ease;
                    container-type: inline-size;
                    container-name: editor-sidebar;
                    min-width: 0;
                }
                .editor-left-panel.collapsed { overflow: visible; }

                .panel-toggle-tab {
                    position: absolute;
                    right: -13px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 26px;
                    height: 56px;
                    background: var(--bg-surface);
                    border: 1px solid rgba(var(--primary-rgb), 0.16);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 200;
                    color: var(--text-secondary);
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
                }
                .panel-toggle-tab:hover { color: var(--primary-color); background: var(--bg-main); }

                .resize-handle {
                    width: 6px;
                    cursor: col-resize;
                    background: transparent;
                    transition: background 0.2s;
                    z-index: 150;
                }
                .resize-handle:hover, .resize-handle:active {
                    background: linear-gradient(180deg, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.5));
                }

                .editor-tabs {
                    padding: 12px;
                    border-bottom: 1px solid rgba(var(--primary-rgb), 0.12);
                    display: flex;
                    gap: 8px;
                    background: rgba(var(--primary-rgb), 0.03);
                }
                .editor-tabs.vertical {
                    position: sticky;
                    top: 0;
                    z-index: 5;
                }
                .editor-tab-btn {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 20px minmax(0, 1fr);
                    align-items: center;
                    gap: 10px;
                    padding: 12px 14px;
                    border-radius: 14px;
                    border: 1px solid transparent;
                    background: transparent;
                    cursor: pointer;
                    color: var(--text-secondary);
                    font-size: 0.88rem;
                    font-weight: 700;
                    text-align: left;
                }
                .editor-tab-btn span {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .editor-tab-btn .icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .editor-tab-btn:hover {
                    background: rgba(var(--primary-rgb), 0.07);
                    border-color: rgba(var(--primary-rgb), 0.12);
                    color: var(--text-primary);
                }
                .editor-tab-btn.active {
                    background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.14), rgba(var(--primary-rgb), 0.08));
                    color: var(--primary-color);
                    border-color: rgba(var(--primary-rgb), 0.24);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
                }

                .tab-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 18px;
                    scrollbar-gutter: stable;
                }
                .wizard-banner {
                    display: grid;
                    gap: 14px;
                    background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.16), rgba(var(--primary-rgb), 0.05));
                    border: 1px solid rgba(var(--primary-rgb), 0.18);
                    border-radius: 20px;
                    padding: 16px;
                    margin-bottom: 18px;
                    box-shadow: 0 16px 34px rgba(var(--primary-rgb), 0.08);
                }
                .wizard-banner-top,
                .bulk-modal-header {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    align-items: flex-start;
                }
                .wizard-kicker {
                    font-size: 0.72rem;
                    font-weight: 800;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: var(--primary-color);
                    margin-bottom: 6px;
                }
                .wizard-banner h3,
                .bulk-modal h3 {
                    margin: 0 0 6px;
                    font-size: 1rem;
                }
                .wizard-banner p,
                .bulk-modal p {
                    margin: 0;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    font-size: 0.84rem;
                }
                .wizard-close-btn,
                .panel-collapse-btn {
                    width: 36px;
                    min-width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: 1px solid rgba(var(--primary-rgb), 0.16);
                    background: var(--bg-surface);
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .wizard-progress {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 8px;
                }
                .wizard-progress-dot {
                    min-height: 34px;
                    border-radius: 999px;
                    border: 1px solid rgba(var(--primary-rgb), 0.14);
                    background: rgba(var(--bg-surface-rgb), 0.72);
                    color: var(--text-secondary);
                    font-weight: 800;
                    cursor: pointer;
                }
                .wizard-progress-dot.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }
                .wizard-progress-dot.done {
                    color: var(--primary-color);
                    border-color: rgba(var(--primary-rgb), 0.24);
                }
                .wizard-actions,
                .bulk-modal-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                }
                .wizard-nav-btn {
                    min-height: 42px;
                    padding: 0 14px;
                    border-radius: 12px;
                    border: 1px solid rgba(var(--primary-rgb), 0.16);
                    background: var(--bg-surface);
                    color: var(--text-primary);
                    cursor: pointer;
                    font-weight: 700;
                }
                .wizard-nav-btn.primary {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
                    color: white;
                    border-color: transparent;
                }
                .wizard-nav-btn:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                }

                .basics-container,
                .publish-container,
                .level-accordions-container,
                .screens-accordion {
                    display: grid;
                    gap: 16px;
                }

                .grid-2 {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr);
                    gap: 16px;
                }

                .settings-group,
                .settings-card,
                .concept-card,
                .level-accordion-item,
                .accordion-item {
                    min-width: 0;
                }

                .settings-group,
                .settings-card {
                    background: linear-gradient(180deg, rgba(var(--bg-surface-rgb), 0.8), rgba(var(--bg-surface-rgb), 0.64));
                    border: 1px solid rgba(var(--primary-rgb), 0.1);
                    border-radius: 18px;
                    padding: 16px;
                    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
                }
                .settings-group {
                    display: grid;
                    gap: 10px;
                    margin-bottom: 0;
                }
                .settings-group h3,
                .settings-card h4,
                .concept-card h4 {
                    margin: 0;
                    font-size: 0.98rem;
                    font-weight: 800;
                    color: var(--text-primary);
                }
                .settings-card h4,
                .concept-card h4 {
                    font-size: 0.9rem;
                }
                .settings-group label {
                    font-size: 0.76rem;
                    margin: 0;
                    display: block;
                    color: var(--text-secondary);
                    font-weight: 700;
                    letter-spacing: 0.01em;
                }
                .editor-ui-scope input,
                .editor-ui-scope select,
                .editor-ui-scope textarea {
                    width: 100%;
                    box-sizing: border-box;
                    border: 1px solid rgba(var(--primary-rgb), 0.12);
                    background: var(--bg-input);
                    color: var(--text-primary);
                    border-radius: 12px;
                    font-size: 0.9rem;
                    line-height: 1.45;
                    padding: 11px 13px;
                    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
                }
                .editor-ui-scope input,
                .editor-ui-scope select {
                    min-height: 44px;
                }
                .editor-ui-scope textarea {
                    min-height: 110px;
                    resize: vertical;
                }
                .editor-ui-scope input:focus,
                .editor-ui-scope select:focus,
                .editor-ui-scope textarea:focus {
                    outline: none;
                    border-color: rgba(var(--primary-rgb), 0.45);
                    box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.08);
                }
                .asset-picker-field {
                    display: grid;
                    gap: 8px;
                    margin-bottom: 0 !important;
                }

                .btn-add-level,
                .btn-add-concept,
                .card-header button,
                .concept-input-row button,
                .level-item .actions button,
                .accordion-header,
                .preview-toolbar button {
                    font-family: 'Inter', sans-serif;
                }
                .btn-add-level,
                .btn-add-concept,
                .card-header button {
                    min-height: 40px;
                    border-radius: 12px;
                    border: 1px solid rgba(var(--primary-rgb), 0.16);
                    background: rgba(var(--primary-rgb), 0.07);
                    color: var(--primary-color);
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 0 14px;
                }
                .btn-add-concept {
                    width: 100%;
                    justify-content: center;
                }

                .levels-list {
                    display: grid;
                    gap: 10px;
                }
                .level-item {
                    display: grid;
                    grid-template-columns: 36px minmax(0, 1fr) auto;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 16px;
                    border: 1px solid rgba(var(--primary-rgb), 0.1);
                    background: rgba(var(--bg-surface-rgb), 0.7);
                    cursor: pointer;
                    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
                }
                .level-item:hover {
                    transform: translateY(-1px);
                    border-color: rgba(var(--primary-rgb), 0.24);
                    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
                }
                .level-item.selected {
                    border-color: rgba(var(--primary-rgb), 0.4);
                    background: rgba(var(--primary-rgb), 0.08);
                }
                .level-item .idx {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    font-size: 0.82rem;
                    font-weight: 800;
                    background: rgba(var(--primary-rgb), 0.12);
                    color: var(--primary-color);
                }
                .level-item .details {
                    min-width: 0;
                    display: grid;
                    gap: 4px;
                }
                .level-item .details strong {
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .level-item .details span {
                    font-size: 0.76rem;
                    color: var(--text-secondary);
                }
                .level-item .actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .level-item .actions button,
                .concept-input-row button {
                    width: 40px;
                    min-width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    border: 1px solid rgba(var(--primary-rgb), 0.12);
                    background: var(--bg-surface);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .level-item .actions button.delete,
                .concept-input-row button {
                    color: #ef4444;
                }

                .level-accordion-item {
                    margin-bottom: 0;
                    border-radius: 18px;
                    border: 1px solid rgba(var(--primary-rgb), 0.1);
                    overflow: hidden;
                    background: rgba(var(--bg-surface-rgb), 0.74);
                    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
                }
                .level-accordion-header,
                .accordion-header {
                    padding: 14px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    background: rgba(var(--bg-surface-rgb), 0.94);
                }
                .level-accordion-header strong { font-size: 0.88rem; }
                .level-accordion-header .header-left,
                .accordion-header .header-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }
                .level-accordion-header .header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                }
                .lvl-badge {
                    width: 28px;
                    height: 28px;
                    font-size: 0.78rem;
                    font-weight: 800;
                    background: var(--primary-color);
                    color: white;
                    border-radius: 999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .count-tag {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 10px;
                    border-radius: 999px;
                    background: rgba(16, 185, 129, 0.12);
                    color: #0f766e;
                    font-size: 0.72rem;
                    font-weight: 800;
                }
                .count-tag.wrong {
                    background: rgba(239, 68, 68, 0.1);
                    color: #b91c1c;
                }
                .accordion-body,
                .accordion-content {
                    padding: 16px;
                    background: rgba(var(--bg-surface-rgb), 0.52);
                    border-top: 1px solid rgba(var(--primary-rgb), 0.08);
                }
                .accordion-item {
                    border: 1px solid rgba(var(--primary-rgb), 0.08);
                    border-radius: 16px;
                    overflow: hidden;
                    background: rgba(var(--bg-surface-rgb), 0.7);
                }
                .arrow {
                    transition: transform 0.18s ease;
                }
                .arrow.up {
                    transform: rotate(180deg);
                }

                .concept-card {
                    background: rgba(var(--bg-surface-rgb), 0.9);
                    border: 1px solid rgba(var(--primary-rgb), 0.1);
                    border-radius: 18px;
                    padding: 16px;
                    display: grid;
                    gap: 14px;
                }
                .concept-card.success {
                    box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.08);
                }
                .concept-card.danger {
                    box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.08);
                }
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .concept-rows {
                    display: grid;
                    gap: 10px;
                }
                .concept-input-row {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 40px;
                    gap: 10px;
                    align-items: center;
                }

                .slider-input {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: 12px;
                    align-items: center;
                }
                .slider-input input[type="range"] {
                    min-height: 22px;
                    padding: 0;
                    background: transparent;
                    box-shadow: none;
                }
                .val-preview {
                    min-width: 62px;
                    text-align: center;
                    padding: 8px 10px;
                    border-radius: 12px;
                    background: rgba(var(--primary-rgb), 0.08);
                    color: var(--primary-color);
                    font-weight: 800;
                    font-size: 0.8rem;
                }

                @container editor-sidebar (min-width: 620px) {
                    .tab-content .grid-2 {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 1180px) {
                    .editor-header {
                        align-items: flex-start;
                    }
                    .header-actions {
                        width: 100%;
                        justify-content: flex-start;
                    }
                }

                .editor-center-panel { flex: 1; background: var(--bg-main); padding: 16px; overflow: hidden; display: flex; flex-direction: column; align-items: center; }
                .preview-container { 
                    width: 100%;
                    max-width: 1024px;
                    flex: 1; 
                    display: flex; 
                    flex-direction: column; 
                    background: #000; 
                    border-radius: 16px; 
                    overflow: hidden; 
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3); 
                    border: 4px solid #1a1a1a; 
                    position: relative;
                }
                #game-container { 
                    transform-origin: top center;
                }

                .screen-preview-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                }

                .screen-mockup-overlay {
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-align: center;
                    padding: 40px;
                }

                .screen-content h1 {
                    font-size: 2.5rem;
                    margin-bottom: 20px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                }

                .screen-content p {
                    font-size: 1.1rem;
                    max-width: 600px;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }

                .preview-game-btn {
                    padding: 12px 32px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 30px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }

                .bg-preview {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    overflow: hidden;
                }

                .preview-ui {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    display: flex;
                    justify-content: space-between;
                    pointer-events: none;
                }

                .score, .timer {
                    background: rgba(0,0,0,0.6);
                    padding: 8px 16px;
                    border-radius: 12px;
                    color: white;
                    font-weight: 700;
                    backdrop-filter: blur(5px);
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .instruction {
                    position: absolute;
                    width: 100%;
                    text-align: center;
                    color: white;
                    font-size: 1.2rem;
                    font-weight: 600;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
                    pointer-events: none;
                }

                .falling-item {
                    position: absolute;
                    background: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                }

                .player-preview {
                    position: absolute;
                    background-size: contain;
                    background-position: center;
                    background-repeat: no-repeat;
                }

                .disabled-badge {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: #ef4444;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                .preview-toolbar { position: relative; z-index: 10; height: 36px; padding: 0 12px; font-size: 0.75rem; background: #1a1a1a; color: rgba(255,255,255,0.6); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
                .phaser-preview-placeholder {
                    flex: 1;
                    width: 100%;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }
                .preview-toolbar button {
                    min-height: unset !important;
                    height: 28px !important;
                    padding: 0 10px !important;
                    border-radius: 6px !important;
                    font-size: 0.75rem !important;
                    z-index: 11 !important;
                    pointer-events: auto !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 4px !important;
                    background: transparent !important;
                    border: none !important;
                    color: var(--primary-color) !important;
                    cursor: pointer !important;
                    font-weight: bold !important;
                    transition: all 0.2s ease !important;
                }
                .preview-toolbar button:hover {
                    background: rgba(var(--primary-rgb), 0.1) !important;
                    color: var(--primary-hover) !important;
                }

                .editor-right-panel {
                    width: 260px;
                    border-left: 1px solid rgba(var(--primary-rgb), 0.12);
                    padding: 12px;
                    font-size: 0.8rem;
                    background: linear-gradient(180deg, rgba(var(--bg-surface-rgb), 0.98), rgba(var(--bg-surface-rgb), 0.92));
                    overflow-y: auto;
                    transition: width 0.2s ease, padding 0.2s ease;
                }
                .editor-right-panel.collapsed {
                    width: 76px;
                    padding: 12px 8px;
                }
                .panel-header {
                    font-size: 0.75rem;
                    margin-bottom: 12px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                .panel-header-title { display: flex; align-items: center; gap: 8px; }
                .summary-list { display: flex; flex-direction: column; gap: 8px; }
                .summary-item { padding: 8px; font-size: 0.75rem; border-radius: 6px; display: flex; align-items: center; gap: 8px; }
                .summary-item.success { background: #ecfdf5; color: #065f46; }
                .summary-item.warning { background: #fffbeb; color: #92400e; }
                .summary-item.info { background: #eff6ff; color: #1e40af; }
                .summary-collapsed-stack {
                    display: grid;
                    gap: 10px;
                    justify-items: center;
                    margin-top: 16px;
                }
                .summary-mini-pill {
                    width: 44px;
                    min-height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(var(--primary-rgb), 0.1);
                    color: var(--primary-color);
                    font-weight: 800;
                    font-size: 0.78rem;
                    text-align: center;
                    padding: 4px;
                }

                .quick-actions h4 { font-size: 0.7rem; margin: 16px 0 8px; color: var(--text-secondary); text-transform: uppercase; }
                .btn-template { padding: 6px 10px; font-size: 0.75rem; margin-bottom: 6px; width: 100%; text-align: left; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-main); cursor: pointer; transition: all 0.2s; }
                .btn-template:hover { border-color: var(--primary-color); background: var(--bg-surface); }

                .test-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
                .modal-content { position: relative; width: 90vw; height: 85vh; border-radius: 20px; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5); }
                .btn-close { position: absolute; top: -50px; right: 0; background: transparent; border: none; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 1rem; }
                .bulk-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(2, 6, 23, 0.62);
                    backdrop-filter: blur(10px);
                    z-index: 2100;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }
                .bulk-modal {
                    width: min(640px, 100%);
                    background: var(--bg-surface);
                    border: 1px solid rgba(var(--primary-rgb), 0.18);
                    border-radius: 24px;
                    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.3);
                    padding: 20px;
                    display: grid;
                    gap: 16px;
                }
                .bulk-textarea {
                    min-height: 220px !important;
                }
                @media (max-width: 980px) {
                    .editor-right-panel:not(.collapsed) {
                        width: 220px;
                    }
                }
            `}</style>
        </MainLayout>
    );
};
