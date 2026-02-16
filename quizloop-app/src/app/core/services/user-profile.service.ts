import { Injectable, signal } from '@angular/core';
import { UserProfile } from '../models/quiz.models';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {

    userProfile = signal<UserProfile>({
        id: 'user-1',
        createdAt: new Date().toISOString(),
        locale: 'en-US',
        streakCurrent: 5,
        streakBest: 12,
        totalGames: 152,
        accuracyPct: 84,
        coins: 1250,
        hasPremium: false
    });

    updateStreak(won: boolean) {
        this.userProfile.update(profile => {
            if (won) {
                const newStreak = profile.streakCurrent + 1;
                return {
                    ...profile,
                    streakCurrent: newStreak,
                    streakBest: Math.max(newStreak, profile.streakBest)
                };
            } else {
                return { ...profile, streakCurrent: 0 };
            }
        });
    }

    addCoins(amount: number) {
        this.userProfile.update(profile => ({
            ...profile,
            coins: profile.coins + Math.floor(amount)
        }));
    }

    incrementGamesPlayed(correctCount: number, totalQuestions: number) {
        this.userProfile.update(profile => {
            const newTotalGames = profile.totalGames + 1;
            // Recalculate rolling accuracy
            const oldTotalCorrect = Math.round((profile.accuracyPct / 100) * profile.totalGames * 10); // approx total correct answers
            const newTotalCorrect = oldTotalCorrect + correctCount;
            const newTotalAnswered = (profile.totalGames * 10) + totalQuestions; // assuming ~10 q per game historically
            const newAccuracy = newTotalAnswered > 0
                ? Math.round((newTotalCorrect / newTotalAnswered) * 100)
                : 0;

            return {
                ...profile,
                totalGames: newTotalGames,
                accuracyPct: Math.min(100, Math.max(0, newAccuracy))
            };
        });
    }
}
