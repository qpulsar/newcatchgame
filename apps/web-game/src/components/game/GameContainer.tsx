import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameConfig } from '../../game/config';
import type { GameProject } from '../../game/types';
import { X } from 'lucide-react';

interface GameContainerProps {
    projectData?: GameProject;
    levelIndex?: number;
    isTestMode?: boolean;
    levelData?: any; // For legacy support
    onClose?: () => void;
}

export const GameContainer: React.FC<GameContainerProps> = ({ projectData, levelIndex, isTestMode, levelData, onClose }) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            const config = { ...GameConfig };
            
            // Verileri Phaser'a aktar
            config.callbacks = {
                preBoot: (game) => {
                    game.registry.set('projectData', projectData);
                    game.registry.set('levelIndex', levelIndex || 0);
                    game.registry.set('isTestMode', isTestMode || false);
                    game.registry.set('levelData', levelData); // Legacy
                }
            };

            gameRef.current = new Phaser.Game(config);
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [projectData, levelIndex, isTestMode, levelData]);

    useEffect(() => {
        if (!containerRef.current || !gameRef.current) {
            return;
        }

        const observer = new ResizeObserver(() => {
            gameRef.current?.scale.refresh();
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [projectData, levelIndex, isTestMode, levelData]);

    return (
        <div 
            id="game-container" 
            ref={containerRef}
            style={{ 
                position: 'relative',
                width: 'min(100%, 1024px, calc((100vh - 220px) * 1.3333))',
                aspectRatio: '1024 / 768',
                height: 'auto',
                margin: '0 auto',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                maxHeight: 'calc(100vh - 220px)'
            }} 
        >
            {onClose && (
                <button 
                    onClick={onClose}
                    className="game-close-btn"
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        zIndex: 1000,
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: 0,
                    }}
                    title="Oyunu Kapat ve Menüye Dön"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <X size={18} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};
