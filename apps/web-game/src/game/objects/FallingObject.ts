import Phaser from 'phaser';

export class FallingObject extends Phaser.GameObjects.Container {
    public text: string;
    public category: string;
    private background: Phaser.GameObjects.Graphics;
    private label: Phaser.GameObjects.Text;
    private angularVelocity: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, text: string, category: string) {
        super(scene, x, y);
        
        this.text = text;
        this.category = category;

        // Metin etiketi
        this.label = scene.add.text(0, 0, text, {
            fontSize: '18px',
            color: '#333333',
            fontWeight: 'bold',
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5);

        // Arka plan (Metne göre boyutlandır)
        const width = this.label.width + 10;
        const height = this.label.height + 6;

        this.background = scene.add.graphics();
        this.background.fillStyle(0xffffff, 1);
        this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        this.background.lineStyle(2, 0x000000, 0.1);
        this.background.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

        // Katmanları ekle
        this.add(this.background);
        this.add(this.label);

        // Sahneye ve fiziğe ekle
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Fizik gövdesini boyutlandır
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(width, height);
        body.setOffset(-width / 2, -height / 2);
        
        body.setCollideWorldBounds(false);
        body.setBounce(0.2);
        
        // Varsayılan açısal hız
        this.angularVelocity = Phaser.Math.Between(-100, 100);
    }

    public setAngularVelocity(velocity: number) {
        this.angularVelocity = velocity;
    }

    // Phaser Container preUpdate handles children but we need it for rotation
    preUpdate(time: number, delta: number) {
        if (this.angularVelocity !== 0) {
            this.rotation += (this.angularVelocity * delta) / 1000 * (Math.PI / 180);
        }
    }

    destroy(fromScene?: boolean) {
        super.destroy(fromScene);
    }
}
