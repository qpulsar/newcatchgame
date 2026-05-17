import Phaser from 'phaser';

export class PlayerPad extends Phaser.Physics.Arcade.Sprite {
    private speed: number;

    constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = 'player', speed: number = 600) {
        super(scene, x, y, textureKey);
        this.speed = speed;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        
        // Boyutlandırma (Gerekirse)
        if (textureKey === 'player') {
            this.setDisplaySize(120, 20);
        } else {
            this.setDisplaySize(80, 80); // Default for custom images
        }

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(false);
        body.setBounce(0, 0);
        body.setDragX(1200);
        body.setMaxVelocity(this.speed, 0);
        if (textureKey === 'player') {
            body.setSize(this.displayWidth, this.displayHeight);
        } else {
            body.setSize(this.displayWidth * 0.82, this.displayHeight * 0.45);
            body.setOffset(this.displayWidth * 0.09, this.displayHeight * 0.38);
        }
    }

    public setSpeed(speed: number) {
        this.speed = speed;
    }

    update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        if (cursors.left.isDown) {
            this.setVelocityX(-this.speed);
        } else if (cursors.right.isDown) {
            this.setVelocityX(this.speed);
        } else {
            this.setVelocityX(0);
        }
    }
}
