import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { GameContainer } from '../components/game/GameContainer';
import { Play as PlayIcon, Info, Trophy, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Play: React.FC = () => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState<any[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8000/levels')
            .then(res => res.json())
            .then(data => {
                setLevels(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching levels:', err);
                setLoading(false);
            });
    }, []);

    const handleEdit = (e: React.MouseEvent, level: any) => {
        e.stopPropagation();
        navigate('/editor', { state: { projectToLoad: level } });
    };

    if (selectedLevel) {
        return (
            <MainLayout>
                <div className="play-page" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <header style={{ marginBottom: '20px', textAlign: 'center', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1024px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <h1 style={{ margin: 0 }}>{selectedLevel.title}</h1>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{selectedLevel.description}</p>
                        </div>
                        <button onClick={() => setSelectedLevel(null)} className="btn-secondary">Geri Dön</button>
                    </header>
                    
                    <GameContainer projectData={selectedLevel} />
                    
                    <div className="game-info" style={{ marginTop: '30px', width: '100%', maxWidth: '1024px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={20} /> Seviye Bilgisi
                            </h3>
                            <p>{selectedLevel.description}</p>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <div>Spawn Hızı: {selectedLevel.data.config.spawnRate}ms</div>
                                <div>Kazanma Skoru: {selectedLevel.data.config.winScore}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trophy size={20} /> Liderlik Tablosu
                            </h3>
                            <Leaderboard levelId={selectedLevel.id} />
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="play-page" style={{ padding: '40px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Oyun Kütüphanesi</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Oynamak istediğiniz bir seviye seçin veya kendi seviyenizi oluşturun.</p>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}>Yükleniyor...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {levels.map(lvl => (
                            <div key={lvl.id} className="level-card" style={{ 
                                background: 'var(--bg-surface)', 
                                borderRadius: '16px', 
                                border: '1px solid var(--border-color)', 
                                overflow: 'hidden',
                                transition: 'transform 0.2s',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onClick={() => setSelectedLevel(lvl)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ 
                                    height: '160px', 
                                    background: lvl.thumbnail_url ? `url(${lvl.thumbnail_url}) center/cover no-repeat` : 'linear-gradient(135deg, #6366f1, #a855f7)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: 'white',
                                    position: 'relative'
                                }}>
                                    {!lvl.thumbnail_url && <PlayIcon size={48} />}
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '12px', 
                                        right: '12px', 
                                        background: 'rgba(0,0,0,0.5)', 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.7rem',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        {lvl.game_type?.toUpperCase() || 'CATCH'}
                                    </div>

                                    {/* Edit Button Overly */}
                                    <button 
                                        onClick={(e) => handleEdit(e, lvl)}
                                        style={{
                                            position: 'absolute',
                                            bottom: '12px',
                                            right: '12px',
                                            background: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                            zIndex: 10
                                        }}
                                    >
                                        <Edit2 size={14} /> Düzenle
                                    </button>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <h3 style={{ margin: '0 0 8px 0' }}>{lvl.title}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 20px 0', height: '40px', overflow: 'hidden' }}>
                                        {lvl.description}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: #{lvl.id}</span>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Trophy size={16} color="var(--primary-color)" />
                                            <Info size={16} color="var(--text-secondary)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

const Leaderboard: React.FC<{ levelId: number }> = ({ levelId }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:8000/leaderboard/${levelId}`)
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching leaderboard:', err);
                setLoading(false);
            });
    }, [levelId]);

    if (loading) return <div>Yükleniyor...</div>;
    if (data.length === 0) return <div style={{ color: 'var(--text-secondary)' }}>Henüz skor kaydedilmemiş.</div>;

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '8px 0' }}>Sıra</th>
                    <th>Oyuncu</th>
                    <th style={{ textAlign: 'right' }}>Skor</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 0' }}>{idx + 1}.</td>
                        <td>{item.full_name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.score}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
