import Phaser from 'phaser';
import { PlayerPad } from '../objects/PlayerPad';
import { FallingObject } from '../objects/FallingObject';
import { TargetBox } from '../objects/TargetBox';
import type { LevelData } from '../types';

export class Game extends Phaser.Scene {
    private player!: PlayerPad;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private items!: Phaser.Physics.Arcade.Group;
    private targets: TargetBox[] = [];
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private levelData!: LevelData;

    constructor() {
        super('Game');
    }

    create() {
        const { width, height } = this.scale;

        // Seviye Verisini Al (Registry veya Cache)
        this.levelData = this.registry.get('levelData') || this.cache.json.get('level1');

        if (!this.levelData) {
            console.error('Level data not found!');
            this.scene.start('MainMenu');
            return;
        }

        // Arka plan
        this.add.image(width / 2, height / 2, this.levelData.background).setDisplaySize(width, height);

        // Skor
        this.scoreText = this.add.text(20, 20, 'Skor: 0', { fontSize: '24px', color: '#fff' });

        // Oyuncu
        this.player = new PlayerPad(this, width / 2, height - 50);
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Hedef Kutular (Level verisinden)
        this.levelData.targets.forEach(t => {
            this.targets.push(new TargetBox(this, t.x, t.y, t.width, t.height, t.category, t.color));
        });

        // Düşen Nesneler Grubu
        this.items = this.physics.add.group();

        // Çarpışma
        this.physics.add.overlap(this.player, this.items, this.handleCatch as any, undefined, this);

        // Sürekli nesne düşür (SpawnRate level config'den)
        this.time.addEvent({
            delay: this.levelData.config.spawnRate,
            callback: this.spawnItem,
            callbackScope: this,
            loop: true
        });

        // ESC ile menüye dön
        this.input.keyboard?.once('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });
    }

    private spawnItem() {
        const { width } = this.scale;
        const x = Phaser.Math.Between(50, width - 50);
        
        const data = Phaser.Utils.Array.GetRandom(this.levelData.items);
        const item = new FallingObject(this, x, -50, data.text, data.category);
        this.items.add(item);
    }

    private handleCatch(player: PlayerPad, item: FallingObject) {
        // Hangi kutunun üzerinde yakaladı?
        let placed = false;
        
        for (const target of this.targets) {
            const bounds = target.getBounds();
            if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), bounds)) {
                if (item.category === target.category) {
                    this.score += 10;
                    this.showFeedback('Doğru!', 0x10b981);
                } else {
                    this.score -= 5;
                    this.showFeedback('Yanlış!', 0xef4444);
                }
                placed = true;
                break;
            }
        }

        if (!placed) {
            // Eğer kutu üzerinde değilse sadece yakalamış olur (puan yok veya az puan)
            this.score += 1;
        }

        this.scoreText.setText(`Skor: ${this.score}`);
        item.destroy();

        // Kazanma kontrolü
        if (this.score >= this.levelData.config.winScore) {
            this.handleWin();
        }
    }

    private async handleWin() {
        this.physics.pause();
        this.items.clear(true, true);
        
        const { width, height } = this.scale;
        this.add.text(width / 2, height / 2, 'TEBRİKLER!', { 
            fontSize: '64px', 
            color: '#10b981', 
            fontWeight: 'bold' 
        }).setOrigin(0.5);

        // Skoru Kaydet
        const token = localStorage.getItem('token');
        if (token && this.levelData.id !== 'new-level') {
            try {
                await fetch('http://localhost:8000/attempts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        level_id: this.levelData.id,
                        score: this.score
                    })
                });
            } catch (err) {
                console.error('Score save error:', err);
            }
        }

        this.time.delayedCall(2000, () => {
            this.scene.start('MainMenu');
        });
    }

    private showFeedback(text: string, color: number) {
        const feedback = this.add.text(this.player.x, this.player.y - 100, text, {
            fontSize: '24px',
            color: '#' + color.toString(16).padStart(6, '0'),
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: feedback,
            y: feedback.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => feedback.destroy()
        });
    }

    update() {
        this.player.update(this.cursors);

        // Ekran dışına çıkanları temizle
        this.items.getChildren().forEach((child: any) => {
            if (child.y > this.scale.height) {
                child.destroy();
            }
        });
    }
}
