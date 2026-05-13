export interface GameProject {
    id?: number;
    title: string;
    description: string;
    thumbnail_url?: string;
    game_type: string;
    course?: string;
    grade_level?: string;
    topic?: string;
    language: string;
    visibility: 'public' | 'private' | 'school' | 'class';
    status: 'draft' | 'review' | 'published' | 'archived';
    data: GameProjectData;
    creator_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface GameProjectData {
    levels: LevelData[];
    settings: CommonSettings;
}

export interface LevelData {
    id: string;
    title: string;
    instruction?: string;
    learning_goal?: string;
    background: string;
    targets: TargetData[];
    correct_concepts: ConceptData[];
    wrong_concepts: ConceptData[];
    duration: number;
    target_score: number;
    success_percentage: number;
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

export interface ConceptData {
    text: string;
    category: string;
    weight: number;
    description?: string;
    image_url?: string;
    sound_url?: string;
}

export interface LevelConfig {
    spawnRate: number;
    gravityY: number;
    playerSpeed: number;
    winScore?: number; // Legacy, use target_score
}

export interface CommonSettings {
    showLeaderboard: boolean;
    allowRetries: boolean;
    themeColor?: string;
}
