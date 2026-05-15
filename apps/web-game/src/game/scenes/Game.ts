import Phaser from 'phaser';
import { PlayerPad } from '../objects/PlayerPad';
import { FallingObject } from '../objects/FallingObject';
import type { GameProject, LevelData, ConceptData } from '../types';

export class Game extends Phaser.Scene {
    private player!: PlayerPad;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private items!: Phaser.Physics.Arcade.Group;
    
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
    private errorCount: number = 0;
    private maxErrors: number = 3;
    private errorText!: Phaser.GameObjects.Text;

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

    preload() {
        if (!this.currentLevelData) return;

        // Load dynamic level background
        const bg = this.currentLevelData.background;
        if (bg && (bg.startsWith('http') || bg.includes('.') || bg.includes('/'))) {
            this.load.image(bg, bg);
        }

        // Load player image
        const pImg = this.currentLevelData.config.player_image;
        if (pImg && (pImg.startsWith('http') || pImg.includes('.') || pImg.includes('/'))) {
            this.load.image(pImg, pImg);
        }

        // Load screens backgrounds
        if (this.currentLevelData.screens) {
            Object.values(this.currentLevelData.screens).forEach(screen => {
                if (screen.background && (screen.background.startsWith('http') || screen.background.includes('.') || screen.background.includes('/'))) {
                    this.load.image(screen.background, screen.background);
                }
            });
        }
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

        this.errorText = this.add.text(width / 2, 120, '', { 
            fontSize: '18px', 
            color: '#ff4444', 
            fontWeight: 'bold' 
        }).setOrigin(0.5);

        this.maxErrors = this.currentLevelData.max_errors || 3;
        this.errorCount = 0;

        // Oyuncu
        const playerKey = (this.currentLevelData.config.player_image && this.currentLevelData.config.player_image !== '') 
            ? this.currentLevelData.config.player_image 
            : 'player';
        this.player = new PlayerPad(this, width / 2, height - 50, playerKey);
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Düşen Nesneler Grubu
        this.items = this.physics.add.group();

        // Çarpışma
        this.physics.add.overlap(this.player, this.items, this.handleCatch as any, undefined, this);

        // Initial State
        this.physics.pause();
        
        // Show Cover Screen
        if (this.currentLevelData.screens?.cover) {
            this.showLevelScreen('cover', () => {
                if (this.currentLevelData.screens?.infoStart?.enabled) {
                    this.showLevelScreen('infoStart', () => this.startGame());
                } else {
                    this.startGame();
                }
            });
        } else {
            this.startGame();
        }

        // ESC ile menüye dön
        this.input.keyboard?.once('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });
    }

    private startGame() {
        this.physics.resume();
        
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
            
            if (this.currentLevelData.config.rotation_enabled) {
                const speed = (this.currentLevelData.config.rotation_speed || 3) * 30;
                item.setAngularVelocity(Phaser.Math.Between(-speed, speed));
            } else {
                item.setAngularVelocity(0);
            }
        }
    }

    private handleCatch(player: PlayerPad, item: FallingObject) {
        // Check if the item is in the correct concepts list
        const isCorrect = this.currentLevelData.correct_concepts.some(c => c.text === item.text);
        
        if (isCorrect) {
            this.levelScore += 10;
            this.totalScore += 10;
            this.showFeedback('Doğru!', 0x10b981);
        } else {
            this.levelScore -= 5;
            this.totalScore -= 5;
            this.errorCount++;
            this.showFeedback('Yanlış!', 0xef4444);
            this.updateErrorDisplay();
        }

        this.scoreText.setText(`Skor: ${this.totalScore}`);
        item.destroy();

        if (this.errorCount >= this.maxErrors) {
            this.handleLevelEnd(false);
        }
    }

    private updateErrorDisplay() {
        if (this.errorCount > 0) {
            this.errorText.setText(`Hatalar: ${this.errorCount}/${this.maxErrors}`);
        }
    }

    private showLevelScreen(type: string, onComplete: () => void) {
        const screens = this.currentLevelData.screens as any;
        if (!screens || !screens[type]) {
            onComplete();
            return;
        }

        const config = screens[type];
        
        const { width, height } = this.scale;
        const container = this.add.container(0, 0).setDepth(2000);

        // Background
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        container.add(overlay);

        if (config.background) {
            const screenBg = this.add.image(width / 2, height / 2, config.background).setDisplaySize(width, height);
            container.add(screenBg);
            // Re-add overlay on top of custom bg but with less opacity if desired
            const subOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);
            container.add(subOverlay);
        }

        // Content
        const title = this.add.text(width / 2, height / 3, config.title, {
            fontSize: '48px', color: '#ffffff', fontWeight: 'bold', align: 'center', wordWrap: { width: width * 0.8 },
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);
        
        const desc = this.add.text(width / 2, height / 2, config.description, {
            fontSize: '24px', color: '#eeeeee', align: 'center', wordWrap: { width: width * 0.7 },
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        const btn = this.add.text(width / 2, height * 0.75, config.buttonText || 'Devam Et', {
            fontSize: '28px', color: '#ffffff', backgroundColor: '#6366f1', padding: { x: 30, y: 15 },
            fontFamily: 'Arial', fontWeight: 'bold'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            container.destroy();
            onComplete();
        })
        .on('pointerover', () => btn.setStyle({ backgroundColor: '#4f46e5' }))
        .on('pointerout', () => btn.setStyle({ backgroundColor: '#6366f1' }));

        container.add([title, desc, btn]);
        
        this.physics.pause();
    }

    private showOverlayMessage(msg: string) {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8).setDepth(3000);
        const text = this.add.text(width / 2, height / 2, msg, {
            fontSize: '32px',
            color: '#fff',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5).setDepth(3001);

        this.physics.pause();
        
        this.input.once('pointerdown', () => {
            bg.destroy();
            text.destroy();
            this.physics.resume();
        });
    }

    private async handleLevelEnd(isSuccessOverride?: boolean) {
        this.physics.pause();
        this.timerEvent?.remove();
        this.items.clear(true, true);
        
        const isSuccess = isSuccessOverride !== undefined ? isSuccessOverride : (this.levelScore >= this.currentLevelData.target_score);
        
        if (isSuccess) {
            this.showLevelScreen('victory', () => {
                if (this.currentLevelData.screens?.infoEnd?.enabled) {
                    this.showLevelScreen('infoEnd', () => this.goToNextStep(true));
                } else {
                    this.goToNextStep(true);
                }
            });
        } else {
            this.showLevelScreen('defeat', () => {
                this.scene.restart({ 
                    projectData: this.projectData, 
                    levelIndex: this.currentLevelIndex,
                    isTestMode: this.isTestMode
                });
            });
        }
    }

    private goToNextStep(isSuccess: boolean) {
        if (isSuccess && this.currentLevelIndex < this.projectData.data.levels.length - 1) {
            // Next Level
            this.scene.restart({ 
                projectData: this.projectData, 
                levelIndex: this.currentLevelIndex + 1,
                isTestMode: this.isTestMode
            });
        } else {
            // Game Over / Project Complete
            if (isSuccess && this.projectData.data.settings.completion_message) {
                this.showOverlayMessage(this.projectData.data.settings.completion_message);
                this.time.delayedCall(3000, () => this.handleProjectComplete());
            } else {
                this.handleProjectComplete();
            }
        }
    }

    private async handleProjectComplete() {
        const token = localStorage.getItem('token');
        if (token && !this.isTestMode && this.projectData.id) {
            try {
                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/attempts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        level_id: this.projectData.id,
                        score: this.totalScore,
                        accuracy: 100,
                        duration: 0,
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
        this.scene.start('MainMenu'); 
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
