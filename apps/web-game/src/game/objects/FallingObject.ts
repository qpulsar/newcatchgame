import Phaser from 'phaser';

export class FallingObject extends Phaser.Physics.Arcade.Sprite {
    public value: string;
    public category: string;

    constructor(scene: Phaser.Scene, x: number, y: number, text: string, category: string) {
        super(scene, x, y, 'item');
        
        this.value = text;
        this.category = category;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(false);
        this.setBounce(0.2);
        
        // Rastgele açısal hız
        this.setAngularVelocity(Phaser.Math.Between(-100, 100));
        
        // Metin etiketi
        const label = scene.add.text(0, 0, text, {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Etiketi nesne ile beraber hareket ettir
        scene.events.on('update', () => {
            if (this.active) {
                label.setPosition(this.x, this.y - 30);
            } else {
                label.destroy();
            }
        });
    }
}
