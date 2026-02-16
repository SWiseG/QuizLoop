export interface Question {
    id: string;
    category: string;
    text: string;
    options: string[];
    correctIndex: number;
    difficulty: string;
    explanation?: string;
}

export interface UserProfile {
    id: string;
    createdAt: string;
    locale: string;
    streakCurrent: number;
    streakBest: number;
    totalGames: number;
    accuracyPct: number;
    coins: number;
    hasPremium: boolean;
}

export interface Round {
    id: string;
    userId: string;
    mode: string;
    score: number;
    correctCount: number;
    startedAt: string;
    endedAt: string;
}
