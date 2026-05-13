import React from 'react';
import { Award } from 'lucide-react';

interface Badge {
    id: number;
    name: string;
    description: string;
}

interface BadgeGridProps {
    badges: Badge[];
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ badges }) => {
    if (badges.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Henüz rozet kazanılmamış. Oyun oynayarak rozet kazanabilirsin!</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
            {badges.map(badge => (
                <div key={badge.id} style={{ 
                    background: 'var(--bg-surface)', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-color)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    cursor: 'help'
                }}
                title={badge.description}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white',
                        marginBottom: '12px',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                    }}>
                        <Award size={32} />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>{badge.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{badge.description}</div>
                </div>
            ))}
        </div>
    );
};
