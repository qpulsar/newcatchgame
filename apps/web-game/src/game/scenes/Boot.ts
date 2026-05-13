import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Temel yükleme ekranı varlıkları buraya
        this.load.image('logo', '/assets/logo.png');
    }

    create() {
        this.scene.start('Preload');
    }
}
