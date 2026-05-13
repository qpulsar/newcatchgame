import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameConfig } from '../../game/config';
import type { GameProject } from '../../game/types';

interface GameContainerProps {
    projectData?: GameProject;
    levelIndex?: number;
    isTestMode?: boolean;
    levelData?: any; // For legacy support
}

export const GameContainer: React.FC<GameContainerProps> = ({ projectData, levelIndex, isTestMode, levelData }) => {
    const gameRef = useRef<Phaser.Game | null>(null);

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

    return (
        <div 
            id="game-container" 
            style={{ 
                width: '1024px', 
                height: '768px', 
                margin: '0 auto',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }} 
        />
    );
};
