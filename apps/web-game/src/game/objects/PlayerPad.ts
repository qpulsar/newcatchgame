import Phaser from 'phaser';

export class PlayerPad extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setImmovable(true);
        
        // Boyutlandırma (Gerekirse)
        this.setDisplaySize(120, 20);
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
