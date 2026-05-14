import Phaser from 'phaser';

export class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        // Oyun varlıklarını yükle
        this.load.setPath('/assets');

        // Geçici placeholder varlıklar (Hata vermemesi için)
        // Gerçek varlıklar eklendiğinde bunlar güncellenecek
        this.load.image('background', 'bg.png');
        this.load.image('player', 'player.png');
        this.load.image('item', 'item.png');
        
        // Seviyeler
        this.load.json('level1', 'levels/level1.json');
        
        // Yükleme çubuğu
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    create() {
        const isTestMode = this.registry.get('isTestMode');
        const projectData = this.registry.get('projectData') || this.registry.get('levelData');

        if (isTestMode || projectData) {
            this.scene.start('Game');
        } else {
            this.scene.start('MainMenu');
        }
    }
}
