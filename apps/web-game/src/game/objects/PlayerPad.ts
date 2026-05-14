import Phaser from 'phaser';

export class PlayerPad extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = 'player') {
        super(scene, x, y, textureKey);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setImmovable(true);
        
        // Boyutlandırma (Gerekirse)
        if (textureKey === 'player') {
            this.setDisplaySize(120, 20);
        } else {
            this.setDisplaySize(80, 80); // Default for custom images
        }
    }

    update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        const speed = 600;

        if (cursors.left.isDown) {
            this.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            this.setVelocityX(speed);
        } else {
            this.setVelocityX(0);
        }
    }
}
