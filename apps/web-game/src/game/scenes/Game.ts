import Phaser from 'phaser';
import { PlayerPad } from '../objects/PlayerPad';
import { FallingObject } from '../objects/FallingObject';
import { TargetBox } from '../objects/TargetBox';
import type { GameProject, LevelData, ConceptData } from '../types';

export class Game extends Phaser.Scene {
    private player!: PlayerPad;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private items!: Phaser.Physics.Arcade.Group;
    private targets: TargetBox[] = [];
    
    private projectData!: GameProject;
    private currentLevelIndex: number = 0;
    private currentLevelData!: LevelData;
    
    private levelScore: number = 0;
    private totalScore: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private infoText!: Phaser.GameObjects.Text;
    
    private isTestMode: boolean = false;
    private timerEvent?: Phaser.Time.TimerEvent;
    private timeLeft: number = 0;
    private timerText!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    init(data: { projectData?: GameProject, levelIndex?: number, isTestMode?: boolean }) {
        this.projectData = data.projectData || this.registry.get('projectData') || this.registry.get('levelData'); // Compatibility
        this.currentLevelIndex = data.levelIndex || 0;
        this.isTestMode = data.isTestMode || this.registry.get('isTestMode') || false;
        
        // Handle legacy structure where levelData is passed directly
        if (this.projectData && !this.projectData.data) {
             // Wrap legacy level data into a project
             const legacyLevel = this.projectData as unknown as LevelData;
             this.projectData = {
                 title: legacyLevel.title,
                 description: '',
                 game_type: 'catch',
                 language: 'tr',
                 visibility: 'public',
                 status: 'published',
                 data: {
                     levels: [legacyLevel],
                     settings: { showLeaderboard: true, allowRetries: true }
                 }
             };
        }
        
        this.currentLevelData = this.projectData.data.levels[this.currentLevelIndex];
        this.levelScore = 0;
    }

    create() {
        if (!this.currentLevelData) {
            console.error('Level data not found!');
            this.scene.start('MainMenu');
            return;
        }

        const { width, height } = this.scale;

        // Arka plan
        this.add.image(width / 2, height / 2, this.currentLevelData.background).setDisplaySize(width, height);

        // UI Panel
        const uiPanel = this.add.graphics();
        uiPanel.fillStyle(0x000000, 0.5);
        uiPanel.fillRect(0, 0, width, 60);

        // UI Texts
        this.scoreText = this.add.text(20, 15, `Skor: ${this.totalScore}`, { fontSize: '24px', color: '#fff', fontWeight: 'bold' });
        this.levelText = this.add.text(width / 2, 15, `Seviye: ${this.currentLevelIndex + 1}/${this.projectData.data.levels.length}`, { fontSize: '24px', color: '#fff', fontWeight: 'bold' }).setOrigin(0.5, 0);
        this.timerText = this.add.text(width - 20, 15, 'Süre: 00', { fontSize: '24px', color: '#fff', fontWeight: 'bold' }).setOrigin(1, 0);
        
        this.infoText = this.add.text(width / 2, 80, this.currentLevelData.instruction || '', { 
            fontSize: '20px', 
            color: '#fff', 
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Oyuncu
        this.player = new PlayerPad(this, width / 2, height - 50);
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Hedef Kutular
        this.targets = [];
        this.currentLevelData.targets.forEach(t => {
            this.targets.push(new TargetBox(this, t.x, t.y, t.width, t.height, t.category, t.color));
        });

        // Düşen Nesneler Grubu
        this.items = this.physics.add.group();

        // Çarpışma
        this.physics.add.overlap(this.player, this.items, this.handleCatch as any, undefined, this);

        // Spawn Timer
        this.time.addEvent({
            delay: this.currentLevelData.config.spawnRate,
            callback: this.spawnItem,
            callbackScope: this,
            loop: true
        });

        // Level Timer
        this.timeLeft = this.currentLevelData.duration;
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // ESC ile menüye dön
        this.input.keyboard?.once('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });
    }

    private updateTimer() {
        this.timeLeft--;
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        this.timerText.setText(`Süre: ${mins}:${secs.toString().padStart(2, '0')}`);

        if (this.timeLeft <= 0) {
            this.handleLevelEnd();
        }
    }

    private spawnItem() {
        const { width } = this.scale;
        const x = Phaser.Math.Between(50, width - 50);
        
        // Combine correct and wrong concepts
        const allConcepts = [...this.currentLevelData.correct_concepts, ...this.currentLevelData.wrong_concepts];
        if (allConcepts.length === 0) return;

        // Weighted random selection
        const totalWeight = allConcepts.reduce((sum, c) => sum + (c.weight || 1), 0);
        let random = Math.random() * totalWeight;
        
        let selectedConcept: ConceptData = allConcepts[0];
        for (const concept of allConcepts) {
            if (random < (concept.weight || 1)) {
                selectedConcept = concept;
                break;
            }
            random -= (concept.weight || 1);
        }

        const item = new FallingObject(this, x, -50, selectedConcept.text, selectedConcept.category);
        this.items.add(item);
        
        // Apply gravity and speed from config
        if (item.body) {
            (item.body as Phaser.Physics.Arcade.Body).setGravityY(this.currentLevelData.config.gravityY);
            (item.body as Phaser.Physics.Arcade.Body).setVelocityY(this.currentLevelData.config.itemSpeed || 200);
        }
    }

    private handleCatch(player: PlayerPad, item: FallingObject) {
        let matched = false;
        let correctTarget = false;

        for (const target of this.targets) {
            const bounds = target.getBounds();
            if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), bounds)) {
                if (item.category === target.category) {
                    this.levelScore += 10;
                    this.totalScore += 10;
                    this.showFeedback('Doğru!', 0x10b981);
                    correctTarget = true;
                } else {
                    this.levelScore -= 5;
                    this.totalScore -= 5;
                    this.showFeedback('Yanlış Kategori!', 0xef4444);
                }
                matched = true;
                break;
            }
        }

        if (!matched) {
            // Check if it was a "correct" item but caught outside a target
            const isCorrectConcept = this.currentLevelData.correct_concepts.some(c => c.text === item.text);
            if (isCorrectConcept) {
                this.levelScore += 2;
                this.totalScore += 2;
                this.showFeedback('Yakalandı!', 0x3b82f6);
            } else {
                this.levelScore -= 2;
                this.totalScore -= 2;
                this.showFeedback('Dikkat!', 0xf59e0b);
            }
        }

        this.scoreText.setText(`Skor: ${this.totalScore}`);
        item.destroy();

        // Immediate win if target score reached (optional)
        if (this.levelScore >= this.currentLevelData.target_score) {
            // this.handleLevelEnd(); 
        }
    }

    private async handleLevelEnd() {
        this.physics.pause();
        this.timerEvent?.remove();
        
        const isSuccess = this.levelScore >= this.currentLevelData.target_score;
        
        const { width, height } = this.scale;
        const msg = isSuccess ? 'SEVİYE TAMAMLANDI!' : 'SÜRE DOLDU';
        const color = isSuccess ? '#10b981' : '#f59e0b';

        const endText = this.add.text(width / 2, height / 2, msg, { 
            fontSize: '64px', 
            color: color, 
            fontWeight: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            if (isSuccess && this.currentLevelIndex < this.projectData.data.levels.length - 1) {
                // Next Level
                this.scene.restart({ 
                    projectData: this.projectData, 
                    levelIndex: this.currentLevelIndex + 1,
                    isTestMode: this.isTestMode
                });
            } else {
                // Game Over / Project Complete
                this.handleProjectComplete();
            }
        });
    }

    private async handleProjectComplete() {
        const token = localStorage.getItem('token');
        if (token && !this.isTestMode && this.projectData.id) {
            try {
                await fetch('http://localhost:8000/attempts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        level_id: this.projectData.id,
                        score: this.totalScore,
                        accuracy: 100, // TODO: calculate
                        duration: 0, // TODO: calculate
                        details: {
                            totalLevels: this.projectData.data.levels.length,
                            completedLevels: this.currentLevelIndex + 1
                        }
                    })
                });
            } catch (err) {
                console.error('Score save error:', err);
            }
        }

        this.scene.start('MainMenu'); // TODO: Create a Result scene
    }

    private showFeedback(text: string, color: number) {
        const feedback = this.add.text(this.player.x, this.player.y - 100, text, {
            fontSize: '24px',
            color: '#' + color.toString(16).padStart(6, '0'),
            fontWeight: 'bold',
            stroke: '#000',
            strokeThickness: 4
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
