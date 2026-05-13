import Phaser from 'phaser';

export class MainMenu extends Phaser.Scene {
    background!: Phaser.GameObjects.Image;
    logo!: Phaser.GameObjects.Image;
    title!: Phaser.GameObjects.Text;

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Arka plan
        this.add.rectangle(0, 0, width, height, 0x6366f1).setOrigin(0);

        this.title = this.add.text(width / 2, height / 3, 'PHYSICS CATCH', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        const playButton = this.add.text(width / 2, height / 2 + 100, 'OYNA', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            backgroundColor: '#4f46e5', padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('Game'));

        const editorButton = this.add.text(width / 2, height / 2 + 200, 'EDİTÖR', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            backgroundColor: '#1e293b', padding: { x: 15, y: 8 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('Editor'));
    }
}
