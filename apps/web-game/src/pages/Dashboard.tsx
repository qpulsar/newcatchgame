import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useTranslation } from 'react-i18next';
import { BadgeGrid } from '../components/profile/BadgeGrid';
import { Trophy, Gamepad2, Calendar, Award } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const [badges, setBadges] = useState<any[]>([]);
    const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalScore: 0,
        gamesPlayed: 0,
        levelsCreated: 0
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Rozetleri getir
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me/badges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.reload();
                return;
            }
            if (!res.ok) return [];
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                setBadges(data);
            }
        })
        .catch(err => console.error('Error fetching badges:', err));

        // Burada gerçekte istatistikleri ve son denemeleri getiren bir endpoint olmalı
        // Şimdilik mock data
        setRecentAttempts([
            { id: 1, level_title: 'Temel Fizik', score: 450, date: '2026-05-13' },
            { id: 2, level_title: 'Hız ve İvme', score: 120, date: '2026-05-12' }
        ]);
        
        setStats({
            totalScore: 570,
            gamesPlayed: 2,
            levelsCreated: 1
        });
    }, []);

    return (
        <MainLayout>
            <div className="dashboard-page" style={{ padding: '40px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Hoş Geldin!</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Öğrenme yolculuğundaki son durumunu buradan takip edebilirsin.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '48px' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', padding: '12px', borderRadius: '12px' }}>
                            <Trophy size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toplam Puan</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalScore}</div>
                        </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '12px' }}>
                            <Gamepad2 size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Oynanan Oyun</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.gamesPlayed}</div>
                        </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '12px' }}>
                            <Award size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kazanılan Rozet</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{badges.length}</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                    <section>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Award size={24} color="var(--primary-color)" /> Başarımlarım
                        </h2>
                        <BadgeGrid badges={badges} />
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Calendar size={24} color="var(--primary-color)" /> Son Aktiviteler
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recentAttempts.map(attempt => (
                                <div key={attempt.id} style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{attempt.level_title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{attempt.date}</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>+{attempt.score} Puan</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </MainLayout>
    );
};
