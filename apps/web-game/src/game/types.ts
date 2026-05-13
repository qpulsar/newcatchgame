export interface LevelData {
    id: string;
    title: string;
    description: string;
    background: string;
    targets: TargetData[];
    items: ItemData[];
    config: LevelConfig;
}

export interface TargetData {
    category: string;
    label: string;
    color: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ItemData {
    text: string;
    category: string;
    weight: number; // Çıkma olasılığı
}

export interface LevelConfig {
    spawnRate: number;
    gravityY: number;
    playerSpeed: number;
    winScore: number;
}
