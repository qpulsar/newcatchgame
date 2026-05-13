import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameConfig } from '../../game/config';

interface GameContainerProps {
    levelData?: any;
}

export const GameContainer: React.FC<GameContainerProps> = ({ levelData }) => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            const config = { ...GameConfig };
            
            // Level verisini Phaser'a aktar
            config.callbacks = {
                preBoot: (game) => {
                    game.registry.set('levelData', levelData);
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
    }, [levelData]);

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
