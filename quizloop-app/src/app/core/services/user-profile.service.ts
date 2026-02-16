import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserProfile } from '../models/quiz.models';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {
    private readonly STORAGE_KEY = 'ql_user_profile';
    private readonly syncUrl = `${environment.apiUrl}/user/sync`;

    private readonly http = inject(HttpClient, { optional: true });
    private readonly auth = inject(AuthService);

    private syncTimer?: ReturnType<typeof setTimeout>;
    private syncInFlight = false;
    private pendingSync = false;

    userProfile = signal<UserProfile>(this.loadProfile());

    constructor() {
        effect(() => {
            const profile = this.userProfile();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
        });

        effect(() => {
            const userId = this.auth.userId();
            const isAuthenticated = this.auth.isAuthenticated();

            if (userId) {
                const current = untracked(() => this.userProfile());
                if (current.id !== userId) {
                    this.userProfile.set({ ...current, id: userId });
                }
            }

            if (isAuthenticated) {
                this.scheduleSync();
            }
        });
    }

    updateStreak(won: boolean) {
        this.userProfile.update(profile => {
            if (won) {
                const newStreak = profile.streakCurrent + 1;
                return {
                    ...profile,
                    streakCurrent: newStreak,
                    streakBest: Math.max(newStreak, profile.streakBest)
                };
            }

            return { ...profile, streakCurrent: 0 };
        });

        this.scheduleSync();
    }

    addCoins(amount: number) {
        this.userProfile.update(profile => ({
            ...profile,
            coins: profile.coins + Math.floor(amount)
        }));

        this.scheduleSync();
    }

    incrementGamesPlayed(correctCount: number, totalQuestions: number) {
        this.userProfile.update(profile => {
            const newTotalGames = profile.totalGames + 1;
            const roundTotal = Math.max(0, Math.floor(totalQuestions));
            const roundCorrect = Math.min(roundTotal, Math.max(0, Math.floor(correctCount)));
            const newTotalCorrect = profile.totalCorrect + roundCorrect;
            const newTotalAnswered = profile.totalAnswered + roundTotal;
            const newAccuracy = newTotalAnswered > 0
                ? Math.round((newTotalCorrect / newTotalAnswered) * 100)
                : 0;

            return {
                ...profile,
                totalGames: newTotalGames,
                totalCorrect: newTotalCorrect,
                totalAnswered: newTotalAnswered,
                accuracyPct: Math.min(100, Math.max(0, newAccuracy))
            };
        });

        this.scheduleSync();
    }

    private createDefaultProfile(): UserProfile {
        return {
            id: this.auth.userId() ?? 'local-user',
            createdAt: new Date().toISOString(),
            locale: 'en-US',
            streakCurrent: 0,
            streakBest: 0,
            totalGames: 0,
            totalCorrect: 0,
            totalAnswered: 0,
            accuracyPct: 0,
            coins: 0,
            hasPremium: false
        };
    }

    private loadProfile(): UserProfile {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
            return this.createDefaultProfile();
        }

        try {
            const parsed = JSON.parse(raw) as Partial<UserProfile>;
            return this.normalizeProfile(parsed);
        } catch {
            return this.createDefaultProfile();
        }
    }

    private normalizeProfile(profile: Partial<UserProfile>): UserProfile {
        const fallback = this.createDefaultProfile();
        const totalGames = this.readInt(profile.totalGames, fallback.totalGames);
        const totalAnswered = this.readInt(
            profile.totalAnswered,
            this.inferLegacyTotalAnswered(profile.accuracyPct, totalGames));
        const totalCorrect = Math.min(
            totalAnswered,
            this.readInt(profile.totalCorrect, this.inferLegacyTotalCorrect(profile.accuracyPct, totalAnswered)));
        const accuracyPct = totalAnswered > 0
            ? Math.round((totalCorrect / totalAnswered) * 100)
            : this.readPercent(profile.accuracyPct, fallback.accuracyPct);

        return {
            id: typeof profile.id === 'string' && profile.id.trim().length > 0 ? profile.id : fallback.id,
            createdAt: typeof profile.createdAt === 'string' && profile.createdAt.length > 0
                ? profile.createdAt
                : fallback.createdAt,
            locale: typeof profile.locale === 'string' && profile.locale.length > 0 ? profile.locale : fallback.locale,
            streakCurrent: this.readInt(profile.streakCurrent, fallback.streakCurrent),
            streakBest: this.readInt(profile.streakBest, fallback.streakBest),
            totalGames,
            totalCorrect,
            totalAnswered,
            accuracyPct,
            coins: this.readInt(profile.coins, fallback.coins),
            hasPremium: typeof profile.hasPremium === 'boolean' ? profile.hasPremium : fallback.hasPremium
        };
    }

    private inferLegacyTotalAnswered(accuracyPct: unknown, totalGames: number): number {
        const accuracy = this.readPercent(accuracyPct, 0);
        if (totalGames === 0) {
            return 0;
        }

        // One-time migration fallback for old profiles that did not track totals.
        return accuracy > 0 ? totalGames * 10 : 0;
    }

    private inferLegacyTotalCorrect(accuracyPct: unknown, totalAnswered: number): number {
        const accuracy = this.readPercent(accuracyPct, 0);
        if (totalAnswered === 0) {
            return 0;
        }

        return Math.round((accuracy / 100) * totalAnswered);
    }

    private readInt(value: unknown, fallback: number): number {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }

        return Math.max(0, Math.floor(parsed));
    }

    private readPercent(value: unknown, fallback: number): number {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return fallback;
        }

        return Math.min(100, Math.max(0, parsed));
    }

    private scheduleSync() {
        if (!this.http || !this.auth.isAuthenticated()) {
            return;
        }

        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }

        this.syncTimer = setTimeout(() => {
            void this.syncProfile();
        }, 250);
    }

    private async syncProfile(): Promise<void> {
        if (!this.http || !this.auth.isAuthenticated()) {
            return;
        }

        if (this.syncInFlight) {
            this.pendingSync = true;
            return;
        }

        this.syncInFlight = true;

        try {
            const token = await this.getFirebaseIdToken();
            if (!token) {
                return;
            }

            const request: SyncProfileRequest = {
                streakCurrent: this.userProfile().streakCurrent,
                streakBest: this.userProfile().streakBest,
                totalGames: this.userProfile().totalGames,
                accuracyPct: this.userProfile().accuracyPct,
                coins: this.userProfile().coins
            };

            const synced = await firstValueFrom(
                this.http.post<UserProfile>(this.syncUrl, request, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            );

            const current = this.userProfile();
            const syncedPartial = synced as Partial<UserProfile>;
            this.userProfile.set(this.normalizeProfile({
                ...syncedPartial,
                totalCorrect: syncedPartial.totalCorrect ?? current.totalCorrect,
                totalAnswered: syncedPartial.totalAnswered ?? current.totalAnswered
            }));
        } catch {
            // Keep local state if remote sync fails.
        } finally {
            this.syncInFlight = false;

            if (this.pendingSync) {
                this.pendingSync = false;
                this.scheduleSync();
            }
        }
    }

    private async getFirebaseIdToken(): Promise<string | null> {
        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.getIdToken();
            return result.token;
        } catch {
            return null;
        }
    }
}

interface SyncProfileRequest {
    streakCurrent: number;
    streakBest: number;
    totalGames: number;
    accuracyPct: number;
    coins: number;
}
