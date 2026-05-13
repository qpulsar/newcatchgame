import Phaser from 'phaser';

export class Editor extends Phaser.Scene {
    constructor() {
        super('Editor');
    }

    create() {
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2, 'Seviye Editörü (Yakında)', { fontSize: '32px' }).setOrigin(0.5);
        
        this.input.keyboard?.once('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });
    }
}
