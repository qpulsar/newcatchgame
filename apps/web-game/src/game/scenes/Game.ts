import Phaser from 'phaser';
import { PlayerPad } from '../objects/PlayerPad';
import { FallingObject } from '../objects/FallingObject';
import type { GameProject, LevelData, ConceptData, AttemptDetails, LevelSummary } from '../types';

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

    // Pedagojik Analitikler
    private analytics = {
        spawnedCorrect: 0,
        spawnedWrong: 0,
        caughtCorrect: 0,
        caughtWrong: 0,
        missedCorrect: 0,
        missedWrong: 0,
        maxStreak: 0,
        currentStreak: 0,
        startTime: 0,
        levelSummaries: [] as LevelSummary[]
    };

    private comboText!: Phaser.GameObjects.Text;
    private bgMusic?: Phaser.Sound.BaseSound;
    private spawnTimer?: Phaser.Time.TimerEvent;

    constructor() {
        super('Game');
    }

    init(data?: { projectData?: GameProject, levelIndex?: number, isTestMode?: boolean }) {
        const safeData = data || {};
        this.projectData = safeData.projectData || this.registry.get('projectData');
        this.currentLevelIndex = safeData.levelIndex ?? this.registry.get('levelIndex') ?? 0;
        this.isTestMode = safeData.isTestMode ?? this.registry.get('isTestMode') ?? false;
        
        if (!this.projectData || !this.projectData.data) {
            console.error('Project data missing!');
            return;
        }

        this.currentLevelData = this.projectData.data.levels[this.currentLevelIndex];
        this.levelScore = 0;
        
        // Reset analytics if first level
        if (this.currentLevelIndex === 0) {
            this.totalScore = 0;
            this.analytics = {
                spawnedCorrect: 0,
                spawnedWrong: 0,
                caughtCorrect: 0,
                caughtWrong: 0,
                missedCorrect: 0,
                missedWrong: 0,
                maxStreak: 0,
                currentStreak: 0,
                startTime: Date.now(),
                levelSummaries: []
            };
        }
    }

    preload() {
        if (!this.currentLevelData) return;

        // Arka planları yükle
        this.loadAsset('bg_level_' + this.currentLevelIndex, this.currentLevelData.background, 'image');

        // Oyuncu görselini yükle
        if (this.currentLevelData.config.player_image) {
            this.loadAsset('player_skin', this.currentLevelData.config.player_image, 'image');
        }

        // Sesleri yükle
        if (this.currentLevelData.music_url) {
            this.loadAsset('bg_music_' + this.currentLevelIndex, this.currentLevelData.music_url, 'audio');
        }
        if (this.currentLevelData.config.sound_correct) {
            this.loadAsset('sfx_correct', this.currentLevelData.config.sound_correct, 'audio');
        }
        if (this.currentLevelData.config.sound_wrong) {
            this.loadAsset('sfx_wrong', this.currentLevelData.config.sound_wrong, 'audio');
        }

        // Ekran arka planlarını yükle
        const commonScreens = this.projectData.data.common_screens;
        if (commonScreens) {
            if (commonScreens.cover?.background) this.loadAsset('bg_cover', commonScreens.cover.background, 'image');
            if (commonScreens.victory?.background) this.loadAsset('bg_victory', commonScreens.victory.background, 'image');
            if (commonScreens.defeat?.background) this.loadAsset('bg_defeat', commonScreens.defeat.background, 'image');
        }
        
        const lvlScreens = this.currentLevelData.screens;
        if (lvlScreens) {
            if (lvlScreens.infoStart?.background) this.loadAsset('bg_infoStart', lvlScreens.infoStart.background, 'image');
            if (lvlScreens.infoEnd?.background) this.loadAsset('bg_infoEnd', lvlScreens.infoEnd.background, 'image');
        }
    }

    private loadAsset(key: string, url: string, type: 'image' | 'audio') {
        if (!url) return;
        
        let fullUrl = url;
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const isLocalFrontend = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
        const uploadsBaseUrl = isLocalFrontend ? window.location.origin : apiBaseUrl;
        
        if (url.startsWith('http')) {
            // Eğer veritabanından absolute URL (ör. localhost:8000) dönüyorsa ama api portu/domaini farklıysa, 
            // host kısmını dinamik olarak apiBaseUrl ile güncelleyelim.
            if (url.includes('/uploads/')) {
                const uploadsIndex = url.indexOf('/uploads/');
                const relativePath = url.substring(uploadsIndex); // '/uploads/filename.png'
                fullUrl = `${uploadsBaseUrl}${relativePath}`;
            }
        } else if (!url.startsWith('data:') && !url.startsWith('/assets/')) {
            if (url.startsWith('/uploads/')) {
                fullUrl = `${uploadsBaseUrl}${url}`;
            } else if (!url.startsWith('/')) {
                fullUrl = `${uploadsBaseUrl}/uploads/${url}`;
            }
        }
        
        if (type === 'image') this.load.image(key, fullUrl);
        else this.load.audio(key, fullUrl);
    }

    create() {
        if (!this.currentLevelData) {
            this.scene.start('MainMenu');
            return;
        }

        const { width, height } = this.scale;

        // Arka plan
        const bgKey = 'bg_level_' + this.currentLevelIndex;
        if (this.textures.exists(bgKey)) {
            this.add.image(width / 2, height / 2, bgKey).setDisplaySize(width, height);
        } else {
            this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
        }

        // UI
        this.createUI();

        this.maxErrors = this.currentLevelData.max_errors || 3;
        this.errorCount = 0;

        // Oyuncu
        const playerKey = this.textures.exists('player_skin') ? 'player_skin' : 'player';
        const playerY = height - Math.max(56, Math.round(height * 0.09));
        this.player = new PlayerPad(this, width / 2, playerY, playerKey, this.currentLevelData.config.playerSpeed || 600);
        this.player.setDepth(50);
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Nesne Grubu
        this.items = this.physics.add.group();

        // Başlangıç Durumu
        this.physics.pause();
        
        // Seviye Akışı
        this.handleInitialScreens();

        // ESC Desteği
        this.input.keyboard?.once('keydown-ESC', () => {
            if (this.bgMusic) this.bgMusic.stop();
            this.scene.start('MainMenu');
        });
    }

    private handleInitialScreens() {
        // İlk seviyeyse kapak ekranını göster
        if (this.currentLevelIndex === 0 && this.projectData.data.common_screens?.cover) {
            this.showScreen('cover', true, () => this.checkInfoStart());
        } else {
            this.checkInfoStart();
        }
    }

    private checkInfoStart() {
        if (this.currentLevelData.screens?.infoStart?.enabled) {
            this.showScreen('infoStart', false, () => this.startGame());
        } else {
            this.startGame();
        }
    }

    private createUI() {
        const { width, height } = this.scale;
        const uiStyle = this.projectData.data.settings.ui_style || 'classic';
        const hasCloseBtn = true;

        switch (uiStyle) {
            case 'modern': this.setupModernUI(width, height, hasCloseBtn); break;
            case 'minimal': this.setupMinimalUI(width, height, hasCloseBtn); break;
            case 'gaming': this.setupGamingUI(width, height, hasCloseBtn); break;
            default: this.setupClassicUI(width, height, hasCloseBtn);
        }

        // Talimat
        this.infoText = this.add.text(width / 2, 85, this.currentLevelData.instruction || '', { 
            fontSize: '18px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)',
            padding: { x: 15, y: 8 }, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(100);

        // Combo
        this.comboText = this.add.text(width / 2, height / 2, '', {
            fontSize: '64px', color: '#fbbf24', fontStyle: 'bold', stroke: '#000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(200).setAlpha(0).setScale(0);
    }

    private setupClassicUI(width: number, height: number, hasCloseBtn: boolean) {
        const uiPanel = this.add.graphics().setDepth(90);
        uiPanel.fillStyle(0x000000, 0.6);
        uiPanel.fillRect(0, 0, width, 60);
        
        const textStyle = { fontSize: '22px', color: '#fff', fontStyle: 'bold' };
        this.scoreText = this.add.text(25, 18, `🏆 Skor: ${this.totalScore}`, textStyle).setDepth(100);
        this.levelText = this.add.text(width / 2, 18, `⭐ Seviye: ${this.currentLevelIndex + 1}/${this.projectData.data.levels.length}`, textStyle).setOrigin(0.5, 0).setDepth(100);
        this.timerText = this.add.text(hasCloseBtn ? width - 80 : width - 25, 18, '⏱️ 0:00', textStyle).setOrigin(1, 0).setDepth(100);
        this.errorText = this.add.text(25, 75, '', { fontSize: '16px', color: '#ff4444', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 8, y: 4 } }).setDepth(100);
    }

    private setupModernUI(width: number, height: number, hasCloseBtn: boolean) {
        const cardStyle = { fontSize: '18px', color: '#fff', fontStyle: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 12, y: 8 } };
        this.scoreText = this.add.text(20, 20, `🏆 ${this.totalScore}`, cardStyle).setDepth(100);
        this.levelText = this.add.text(width / 2, 20, `SEVİYE ${this.currentLevelIndex + 1}`, cardStyle).setOrigin(0.5, 0).setDepth(100);
        this.timerText = this.add.text(hasCloseBtn ? width - 75 : width - 20, 20, '⏱️ 0:00', cardStyle).setOrigin(1, 0).setDepth(100);
        this.errorText = this.add.text(20, 70, '', { ...cardStyle, color: '#ff4444' }).setDepth(100);
    }

    private setupMinimalUI(width: number, height: number, hasCloseBtn: boolean) {
        const textStyle = { fontSize: '22px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 };
        this.scoreText = this.add.text(20, 20, `${this.totalScore}`, textStyle).setDepth(100);
        this.levelText = this.add.text(width / 2, 20, `${this.currentLevelIndex + 1}`, textStyle).setOrigin(0.5, 0).setDepth(100);
        this.timerText = this.add.text(hasCloseBtn ? width - 70 : width - 20, 20, '0:00', textStyle).setOrigin(1, 0).setDepth(100);
        this.errorText = this.add.text(20, 55, '', { ...textStyle, color: '#ef4444', fontSize: '18px' }).setDepth(100);
    }

    private setupGamingUI(width: number, height: number, hasCloseBtn: boolean) {
        const textStyle = { fontSize: '18px', color: '#38bdf8', fontStyle: 'bold', fontFamily: 'monospace' };
        this.scoreText = this.add.text(20, 18, `SCORE:${this.totalScore}`, textStyle).setDepth(100);
        this.levelText = this.add.text(width / 2, 18, `LVL:${this.currentLevelIndex + 1}`, textStyle).setOrigin(0.5, 0).setDepth(100);
        this.timerText = this.add.text(hasCloseBtn ? width - 80 : width - 25, 18, 'TIME:0:00', textStyle).setOrigin(1, 0).setDepth(100);
        this.errorText = this.add.text(20, 60, '', { ...textStyle, color: '#f87171' }).setDepth(100);
    }

    private startGame() {
        this.physics.resume();
        
        // Müzik
        const musicKey = 'bg_music_' + this.currentLevelIndex;
        if (this.cache.audio.exists(musicKey)) {
            this.bgMusic = this.sound.add(musicKey, { loop: true, volume: 0.4 });
            this.bgMusic.play();
        }

        // Nesne Üretimi
        this.spawnTimer?.remove(false);
        this.spawnTimer = this.time.addEvent({
            delay: this.currentLevelData.config.spawnRate || 2000,
            callback: this.spawnItem,
            callbackScope: this,
            loop: true
        });

        // Zamanlayıcı
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
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        const uiStyle = this.projectData.data.settings.ui_style || 'classic';
        if (uiStyle === 'gaming') this.timerText.setText(`TIME:${timeStr}`);
        else if (uiStyle === 'minimal') this.timerText.setText(timeStr);
        else this.timerText.setText(`⏱️ ${timeStr}`);

        if (this.timeLeft <= 0) this.handleLevelEnd();
    }

    private spawnItem() {
        const { width } = this.scale;
        const allConcepts = [...this.currentLevelData.correct_concepts, ...this.currentLevelData.wrong_concepts];
        if (allConcepts.length === 0) return;

        // Ağırlıklı Rastgele Seçim
        const totalWeight = allConcepts.reduce((sum, c) => sum + (c.weight || 1), 0);
        let random = Math.random() * totalWeight;
        let selected: ConceptData = allConcepts[0];
        for (const c of allConcepts) {
            if (random < (c.weight || 1)) { selected = c; break; }
            random -= (c.weight || 1);
        }

        const isCorrect = this.currentLevelData.correct_concepts.some(c => c.text === selected.text);
        if (isCorrect) this.analytics.spawnedCorrect++;
        else this.analytics.spawnedWrong++;

        const item = new FallingObject(this, width / 2, -60, selected.text, isCorrect ? 'correct' : 'wrong');
        this.items.add(item);
        
        if (item.body) {
            const body = item.body as Phaser.Physics.Arcade.Body;
            const safeSize = item.getSafeRadius();
            const spawnPadding = Math.max(24, Math.ceil(safeSize.width / 2) + 12);
            item.x = Phaser.Math.Between(spawnPadding, Math.max(spawnPadding, width - spawnPadding));

            body.setAllowGravity(false);
            body.setAcceleration(0, 0);
            body.setDrag(0, 0);
            body.setVelocity(0, this.currentLevelData.config.itemSpeed || 200);
            body.setMaxVelocity(0, this.currentLevelData.config.itemSpeed || 200);

            if (this.currentLevelData.config.rotation_enabled === true) {
                const rotSpeed = Math.min((this.currentLevelData.config.rotation_speed || 3) * 8, 24);
                item.setAngularVelocity(Phaser.Math.Between(-rotSpeed, rotSpeed));
            } else {
                item.setAngularVelocity(0);
                item.setRotation(0);
            }
        }
    }

    private handleCatch(player: PlayerPad, item: FallingObject) {
        const isCorrect = item.category === 'correct';
        
        if (isCorrect) {
            this.analytics.caughtCorrect++;
            this.analytics.currentStreak++;
            if (this.analytics.currentStreak > this.analytics.maxStreak) this.analytics.maxStreak = this.analytics.currentStreak;

            let multiplier = 1;
            if (this.analytics.currentStreak >= 10) multiplier = 3;
            else if (this.analytics.currentStreak >= 5) multiplier = 2;

            const points = (this.currentLevelData.config.points_correct || 10) * multiplier;
            this.levelScore += points;
            this.totalScore += points;
            
            this.showFeedback(multiplier > 1 ? `+${points} (${multiplier}x)` : `+${points}`, 0x10b981);
            if (multiplier > 1) this.showComboFeedback(this.analytics.currentStreak);
            if (this.cache.audio.exists('sfx_correct')) this.sound.play('sfx_correct');
            this.handleVisualEffect('correct');
        } else {
            this.analytics.caughtWrong++;
            this.analytics.currentStreak = 0;
            
            const penalty = this.currentLevelData.config.points_wrong || 5;
            this.levelScore -= penalty;
            this.totalScore -= penalty;
            this.errorCount++;
            
            this.showFeedback(`-${penalty}`, 0xef4444);
            this.updateErrorDisplay();
            if (this.cache.audio.exists('sfx_wrong')) this.sound.play('sfx_wrong');
            this.handleVisualEffect('wrong');
        }

        this.updateScoreDisplay();
        item.destroy();

        if (this.errorCount >= this.maxErrors) this.handleLevelEnd(true);
    }

    private handleVisualEffect(type: 'correct' | 'wrong') {
        const effect = type === 'correct' ? (this.currentLevelData.effect_correct || 'sparkle') : (this.currentLevelData.effect_wrong || 'shake');
        
        if (type === 'wrong') {
            if (effect === 'shake') this.cameras.main.shake(200, 0.01);
            this.player.setTint(0xff4444);
            this.time.delayedCall(200, () => this.player.clearTint());
        } else {
            if (effect === 'pop') {
                this.tweens.add({ 
                    targets: this.player, 
                    scaleX: this.player.scaleX * 1.2,
                    scaleY: this.player.scaleY * 1.2,
                    duration: 100, 
                    yoyo: true 
                });
            } else if (effect === 'glow') {
                this.player.setTint(0x44ff44);
                this.time.delayedCall(200, () => this.player.clearTint());
            } else {
                // Sparkle logic could be added here
                this.player.setTint(0xfcd34d);
                this.time.delayedCall(150, () => this.player.clearTint());
            }
        }
    }

    private showComboFeedback(streak: number) {
        this.comboText.setText(`${streak} KOMBO!`).setAlpha(1).setScale(0);
        this.tweens.add({
            targets: this.comboText,
            scale: { from: 0.5, to: 1.2 },
            duration: 300,
            yoyo: true,
            hold: 400,
            onComplete: () => this.comboText.setAlpha(0)
        });
    }

    private updateScoreDisplay() {
        const uiStyle = this.projectData.data.settings.ui_style || 'classic';
        if (uiStyle === 'gaming') this.scoreText.setText(`SCORE:${this.totalScore}`);
        else if (uiStyle === 'minimal') this.scoreText.setText(`${this.totalScore}`);
        else this.scoreText.setText(`🏆 Skor: ${this.totalScore}`);
    }

    private updateErrorDisplay() {
        const uiStyle = this.projectData.data.settings.ui_style || 'classic';
        const remainingLives = Math.max(0, this.maxErrors - this.errorCount);
        
        let hearts = '';
        for (let i = 0; i < this.maxErrors; i++) {
            if (i < remainingLives) {
                hearts += '❤️';
            } else {
                hearts += '🖤';
            }
        }
        
        if (uiStyle === 'gaming') this.errorText.setText(`HP:${hearts}`);
        else if (uiStyle === 'minimal') this.errorText.setText(hearts);
        else this.errorText.setText(`Canlar: ${hearts}`);
    }

    private showScreen(type: string, isCommon: boolean, onComplete: () => void) {
        const config = isCommon 
            ? this.projectData.data.common_screens?.[type as keyof typeof this.projectData.data.common_screens]
            : (this.currentLevelData.screens as any)?.[type];
            
        if (!config || (config.enabled === false)) { onComplete(); return; }

        const { width, height } = this.scale;
        const container = this.add.container(0, 0).setDepth(2000);
        
        // Arka Plan Karartma
        container.add(this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85));

        // Özel Arka Plan Görseli
        const bgKey = 'bg_' + type;
        if (this.textures.exists(bgKey)) {
            container.add(this.add.image(width / 2, height / 2, bgKey).setDisplaySize(width, height).setAlpha(0.6));
        }

        // Metinler
        container.add(this.add.text(width / 2, height / 3, config.title || '', {
            fontSize: '48px', color: '#fff', fontStyle: 'bold', align: 'center', wordWrap: { width: width * 0.8 }, stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5));
        
        container.add(this.add.text(width / 2, height / 2, config.description || '', {
            fontSize: '22px', color: '#ddd', align: 'center', wordWrap: { width: width * 0.7 }, stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5));

        const btn = this.add.text(width / 2, height * 0.75, config.buttonText || 'Devam Et', {
            fontSize: '28px', color: '#fff', backgroundColor: '#4f46e5', padding: { x: 35, y: 15 }, fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { container.destroy(); onComplete(); })
        .on('pointerover', () => btn.setStyle({ backgroundColor: '#6366f1' }))
        .on('pointerout', () => btn.setStyle({ backgroundColor: '#4f46e5' }));
        
        container.add(btn);
        this.physics.pause();
    }

    private async handleLevelEnd(isManualFail: boolean = false) {
        this.physics.pause();
        this.timerEvent?.remove();
        this.spawnTimer?.remove(false);
        this.items.clear(true, true);
        if (this.bgMusic) this.bgMusic.stop();
        
        const accuracy = this.analytics.spawnedCorrect > 0 
            ? (this.analytics.caughtCorrect / this.analytics.spawnedCorrect) * 100 
            : 100;

        const isScoreSuccess = this.levelScore >= (this.currentLevelData.target_score || 0);
        const isAccuracySuccess = accuracy >= (this.currentLevelData.success_percentage || 70);
        const isSuccess = !isManualFail && isScoreSuccess && isAccuracySuccess;
        
        // Seviye Özetini Kaydet
        this.analytics.levelSummaries.push({
            level_index: this.currentLevelIndex,
            score: this.levelScore,
            caught_correct: this.analytics.caughtCorrect,
            caught_wrong: this.analytics.caughtWrong,
            missed_correct: this.analytics.spawnedCorrect - this.analytics.caughtCorrect,
            accuracy: Math.round(accuracy),
            success: isSuccess
        });

        if (isSuccess) {
            this.showScreen('victory', this.currentLevelIndex === this.projectData.data.levels.length - 1, () => {
                if (this.currentLevelData.screens?.infoEnd?.enabled) {
                    this.showScreen('infoEnd', false, () => this.nextLevel());
                } else {
                    this.nextLevel();
                }
            });
        } else {
            this.showScreen('defeat', true, () => {
                this.scene.restart({ projectData: this.projectData, levelIndex: this.currentLevelIndex, isTestMode: this.isTestMode });
            });
        }
    }

    private nextLevel() {
        if (this.currentLevelIndex < this.projectData.data.levels.length - 1) {
            this.scene.restart({ projectData: this.projectData, levelIndex: this.currentLevelIndex + 1, isTestMode: this.isTestMode });
        } else {
            this.handleProjectComplete();
        }
    }

    private async handleProjectComplete() {
        const token = localStorage.getItem('token');
        const duration = Math.floor((Date.now() - this.analytics.startTime) / 1000);
        const totalCaught = this.analytics.caughtCorrect + this.analytics.caughtWrong;
        const finalAccuracy = totalCaught > 0 ? Math.round((this.analytics.caughtCorrect / totalCaught) * 100) : 100;
        const details: AttemptDetails = {
            total_levels: this.projectData.data.levels.length,
            completed_levels: this.currentLevelIndex + 1,
            spawned_correct: this.analytics.spawnedCorrect,
            spawned_wrong: this.analytics.spawnedWrong,
            caught_correct: this.analytics.caughtCorrect,
            caught_wrong: this.analytics.caughtWrong,
            missed_correct: this.analytics.spawnedCorrect - this.analytics.caughtCorrect,
            missed_wrong: this.analytics.spawnedWrong - this.analytics.caughtWrong,
            max_streak: this.analytics.maxStreak,
            accuracy: finalAccuracy,
            level_summaries: this.analytics.levelSummaries,
            success: true
        };

        if (token && !this.isTestMode && this.projectData.id) {
            try {
                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/attempts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        level_id: this.projectData.id,
                        score: this.totalScore,
                        accuracy: finalAccuracy,
                        duration: duration,
                        details: details
                    })
                });
            } catch (err) { console.error('Score save error:', err); }
        }

        if (this.projectData.data.settings.completion_message) {
            this.showFinalMessage(this.projectData.data.settings.completion_message, () => {
                this.scene.start('Summary', { projectData: this.projectData, details, totalScore: this.totalScore });
            });
        } else {
            this.scene.start('Summary', { projectData: this.projectData, details, totalScore: this.totalScore });
        }
    }

    private showFinalMessage(msg: string, onComplete: () => void) {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9).setDepth(5000);
        this.add.text(width / 2, height / 2, msg, { fontSize: '32px', color: '#fff', align: 'center', wordWrap: { width: width * 0.8 } }).setOrigin(0.5).setDepth(5001);
        this.input.once('pointerdown', () => onComplete());
    }

    private showFeedback(text: string, color: number) {
        const feedback = this.add.text(this.player.x, this.player.y - 100, text, {
            fontSize: '28px', color: '#' + color.toString(16).padStart(6, '0'), fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({ targets: feedback, y: feedback.y - 80, alpha: 0, duration: 1000, onComplete: () => feedback.destroy() });
    }

    private areBoundsTouching(a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle) {
        return (
            a.right >= b.left &&
            a.left <= b.right &&
            a.bottom >= b.top &&
            a.top <= b.bottom
        );
    }

    update() {
        if (this.player && this.player.active) {
            this.player.update(this.cursors);
        }

        // Temizlik ve Kaçırılanları Say
        const playerBounds = this.player?.getBounds();
        this.items.getChildren().forEach((child: any) => {
            if (playerBounds && child.active && this.areBoundsTouching(playerBounds, child.getBounds())) {
                this.handleCatch(this.player, child);
                return;
            }

            if (child.y > this.scale.height) {
                if (child.category === 'correct') this.analytics.missedCorrect++;
                else this.analytics.missedWrong++;
                child.destroy();
            }
        });
    }
}
