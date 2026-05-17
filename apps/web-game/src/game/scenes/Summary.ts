import Phaser from 'phaser';
import type { AttemptDetails, GameProject } from '../types';

export class Summary extends Phaser.Scene {
    private projectData!: GameProject;
    private details!: AttemptDetails;
    private totalScore: number = 0;

    constructor() {
        super('Summary');
    }

    init(data: { projectData: GameProject, details: AttemptDetails, totalScore: number }) {
        this.projectData = data.projectData;
        this.details = data.details;
        this.totalScore = data.totalScore;
    }

    create() {
        const { width, height } = this.scale;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a, 1);
        
        // Gradient overlay (Subtle)
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1e293b, 0x1e293b, 0x0f172a, 0x0f172a, 1);
        graphics.fillRect(0, 0, width, height);

        // Title
        this.add.text(width / 2, 80, '🎯 Öğrenme Raporu', {
            fontSize: '42px', color: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 130, this.projectData.title, {
            fontSize: '24px', color: '#94a3b8'
        }).setOrigin(0.5);

        // Stats Container
        const centerX = width / 2;
        const startY = 220;
        const spacing = 70;

        // Score Card
        this.createStatCard(centerX, startY, 'Toplam Skor', this.totalScore.toString(), '#f59e0b');
        
        // Accuracy Card
        this.createStatCard(centerX, startY + spacing, 'Başarı Oranı', `%${this.details.accuracy}`, this.getAccuracyColor(this.details.accuracy));
        
        // Caught Correct vs Missed
        const correctInfo = `${this.details.caught_correct} / ${this.details.spawned_correct}`;
        this.createStatCard(centerX, startY + spacing * 2, 'Doğru Kavram Yakalama', correctInfo, '#10b981');

        // Wrong Items (Avoided)
        const wrongAvoided = this.details.spawned_wrong - this.details.caught_wrong;
        const wrongInfo = `${wrongAvoided} / ${this.details.spawned_wrong}`;
        this.createStatCard(centerX, startY + spacing * 3, 'Hatalı Kavramlardan Kaçınma', wrongInfo, '#ef4444');

        // Streak
        this.createStatCard(centerX, startY + spacing * 4, 'En Yüksek Seri', this.details.max_streak.toString(), '#8b5cf6');

        // Pedagogical Feedback
        const feedback = this.getPedagogicalFeedback();
        const feedbackBox = this.add.rectangle(centerX, 600, 700, 100, 0x1e293b, 1).setStrokeStyle(2, 0x334155);
        this.add.text(centerX, 600, feedback, {
            fontSize: '20px', color: '#cbd5e1', align: 'center', wordWrap: { width: 650 }
        }).setOrigin(0.5);

        // Buttons
        const btnY = 700;
        const restartBtn = this.createButton(centerX - 120, btnY, 'Tekrar Oyna', '#4f46e5', () => {
            this.scene.start('Game', { projectData: this.projectData, levelIndex: 0 });
        });

        const menuBtn = this.createButton(centerX + 120, btnY, 'Ana Menü', '#334155', () => {
            this.scene.start('MainMenu');
        });

        // Animations
        this.tweens.add({
            targets: [restartBtn, menuBtn],
            y: btnY - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createStatCard(x: number, y: number, label: number | string, value: string, color: string) {
        const bg = this.add.rectangle(x, y, 600, 60, 0x1e293b, 0.5).setStrokeStyle(1, 0x334155);
        this.add.text(x - 280, y, label.toString(), { fontSize: '20px', color: '#94a3b8' }).setOrigin(0, 0.5);
        this.add.text(x + 280, y, value, { fontSize: '26px', color: color, fontStyle: 'bold' }).setOrigin(1, 0.5);
        
        // Animation
        bg.width = 0;
        this.tweens.add({
            targets: bg,
            width: 600,
            duration: 800,
            ease: 'Power2'
        });
    }

    private createButton(x: number, y: number, text: string, color: string, callback: () => void) {
        const btn = this.add.text(x, y, text, {
            fontSize: '22px', color: '#fff', backgroundColor: color, padding: { x: 25, y: 12 }, fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', callback)
        .on('pointerover', () => btn.setScale(1.05))
        .on('pointerout', () => btn.setScale(1));
        
        return btn;
    }

    private getAccuracyColor(acc: number): string {
        if (acc >= 90) return '#10b981';
        if (acc >= 70) return '#f59e0b';
        return '#ef4444';
    }

    private getPedagogicalFeedback(): string {
        const acc = this.details.accuracy;
        if (acc >= 90) return "Harika! Kavramları mükemmel bir şekilde ayırt ettin. Konuya tam hakimsin!";
        if (acc >= 75) return "Çok iyi bir performans. Bazı küçük hataların olsa da genel mantığı kavramış görünüyorsun.";
        if (acc >= 50) return "İyi gidiyorsun, ancak bazı kavramlar arasında hala kafa karışıklığı yaşıyor olabilirsin. Biraz daha pratikle uzmanlaşabilirsin.";
        return "Öğrenme yolculuğunda daha fazla pratik yapman gerekebilir. Kavramları tekrar gözden geçirip tekrar denemeye ne dersin?";
    }
}
