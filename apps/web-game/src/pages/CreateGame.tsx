import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Gamepad2, ArrowRight, Zap, Target, MousePointer2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';

export const CreateGame: React.FC = () => {
    const { t } = useTranslation();

    const gameTypes = [
        {
            id: 'catch',
            title: t('create.catch.title'),
            description: t('create.catch.desc'),
            icon: <Target size={48} />,
            color: '#6366f1',
            path: '/editor',
            features: ['Fizik Motoru', 'Kavram Sınıflandırma', 'Sürükle-Bırak']
        }
        // Gelecekte buraya yeni oyun türleri eklenebilir
    ];

    return (
        <MainLayout>
            <div className="create-game-container">
                <header className="create-game-header">
                    <h1>{t('create.title')}</h1>
                    <p>{t('create.subtitle')}</p>
                </header>

                <div className="game-type-grid">
                    {gameTypes.map((type) => (
                        <Link to={type.path} key={type.id} className="game-type-card">
                            <div className="card-preview">
                                {type.icon}
                            </div>
                            <div className="card-content">
                                <h3>{type.title}</h3>
                                <p>{type.description}</p>
                                
                                <div className="card-footer">
                                    <span>{t('create.select')}</span>
                                    <ArrowRight className="arrow" size={18} />
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Placeholder for future types */}
                    <div className="game-type-card" style={{ opacity: 0.5, cursor: 'default' }}>
                        <div className="card-preview" style={{ background: 'var(--bg-main)' }}>
                            <Zap size={48} color="var(--text-secondary)" />
                        </div>
                        <div className="card-content">
                            <h3>Yakında...</h3>
                            <p>Daha fazla oyun şablonu ve etkileşimli içerik türü üzerinde çalışıyoruz.</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};
