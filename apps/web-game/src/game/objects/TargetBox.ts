import Phaser from 'phaser';

export class TargetBox extends Phaser.GameObjects.Container {
    public category: string;
    private background: Phaser.GameObjects.Rectangle;
    private label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, category: string, color: number) {
        super(scene, x, y);
        
        this.category = category;

        this.background = scene.add.rectangle(0, 0, width, height, color, 0.3);
        this.background.setStrokeStyle(2, color);
        
        this.label = scene.add.text(0, height / 2 + 20, category, {
            fontSize: '18px',
            color: '#' + color.toString(16).padStart(6, '0'),
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add([this.background, this.label]);
        scene.add.existing(this);
    }

    // Çarpışma kutusu olarak kullanmak için dikdörtgeni döndür
    getBounds() {
        return this.background.getBounds();
    }
}
