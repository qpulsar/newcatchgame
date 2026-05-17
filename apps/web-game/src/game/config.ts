import { Boot } from './scenes/Boot';
import { Preload } from './scenes/Preload';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';
import { Editor } from './scenes/Editor';
import { Summary } from './scenes/Summary';
import Phaser from 'phaser';

export const GameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 300 },
            debug: false
        }
    },
    scene: [
        Boot,
        Preload,
        MainMenu,
        Game,
        Editor,
        Summary
    ]
};
