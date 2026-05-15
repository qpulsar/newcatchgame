export interface GameProject {
    id?: number;
    title: string;
    description: string;
    thumbnail_url?: string;
    game_type: string;
    course?: string;
    grade_level?: string;
    topic?: string;
    tags?: string[];
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
    common_screens?: LevelScreens;
}

export interface ScreenConfig {
    title?: string;
    description?: string;
    buttonText?: string;
    background?: string;
    music?: string;
    enabled?: boolean;
}

export interface LevelScreens {
    cover?: ScreenConfig;
    victory?: ScreenConfig;
    defeat?: ScreenConfig;
    infoStart?: ScreenConfig;
    infoEnd?: ScreenConfig;
}

export interface LevelData {
    id: string;
    title: string;
    instruction?: string;
    learning_goal?: string;
    background: string;
    music_url?: string;
    effect_correct?: string;
    effect_wrong?: string;
    targets: TargetData[];
    correct_concepts: ConceptData[];
    wrong_concepts: ConceptData[];
    duration: number;
    target_score: number;
    success_percentage: number;
    max_errors?: number;
    config: LevelConfig;
    screens?: LevelScreens;
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
    itemSpeed: number;
    max_items?: number;
    min_distance?: number;
    rotation_enabled?: boolean;
    rotation_speed?: number;
    canvas_ratio?: '4:3' | '16:9' | 'custom';
    player_image?: string;
    sound_correct?: string;
    sound_wrong?: string;
    points_correct?: number;
    points_wrong?: number;
}

export interface CommonSettings {
    showLeaderboard: boolean;
    allowRetries: boolean;
    themeColor?: string;
    initial_message?: string;
    completion_message?: string;
}
