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

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const headers = { 'Authorization': `Bearer ${token}` };

        // Rozetleri getir
        fetch(`${apiUrl}/users/me/badges`, { headers })
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

        // İstatistikleri getir
        fetch(`${apiUrl}/users/me/stats`, { headers })
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        })
        .then(data => {
            if (data) {
                setStats({
                    totalScore: data.totalScore ?? 0,
                    gamesPlayed: data.gamesPlayed ?? 0,
                    levelsCreated: data.levelsCreated ?? 0
                });
            }
        })
        .catch(err => console.error('Error fetching stats:', err));

        // Son denemeleri getir
        fetch(`${apiUrl}/users/me/attempts`, { headers })
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch attempts');
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                setRecentAttempts(data);
            }
        })
        .catch(err => console.error('Error fetching attempts:', err));
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
