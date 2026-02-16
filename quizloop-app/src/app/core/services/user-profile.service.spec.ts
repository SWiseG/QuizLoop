import { TestBed } from '@angular/core/testing';
import { UserProfileService } from './user-profile.service';

describe('UserProfileService', () => {
    let service: UserProfileService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UserProfileService]
        });

        service = TestBed.inject(UserProfileService);
        service.userProfile.set({
            id: 'test-user',
            createdAt: new Date().toISOString(),
            locale: 'en-US',
            streakCurrent: 5,
            streakBest: 12,
            totalGames: 1,
            accuracyPct: 0,
            coins: 1000,
            hasPremium: false
        });
    });

    it('updateStreak(true) increments streakCurrent and updates streakBest when needed', () => {
        service.userProfile.set({
            ...service.userProfile(),
            streakCurrent: 12,
            streakBest: 12
        });

        service.updateStreak(true);

        expect(service.userProfile().streakCurrent).toBe(13);
        expect(service.userProfile().streakBest).toBe(13);
    });

    it('updateStreak(false) resets streakCurrent to 0 and keeps streakBest unchanged', () => {
        service.userProfile.set({
            ...service.userProfile(),
            streakCurrent: 9,
            streakBest: 12
        });

        service.updateStreak(false);

        expect(service.userProfile().streakCurrent).toBe(0);
        expect(service.userProfile().streakBest).toBe(12);
    });

    it('addCoins floors decimal amounts and adds to existing coins', () => {
        service.addCoins(500);
        expect(service.userProfile().coins).toBe(1500);

        service.addCoins(99.7);
        expect(service.userProfile().coins).toBe(1599);
    });

    it('incrementGamesPlayed(8, 10) increments totalGames and recalculates accuracy', () => {
        service.incrementGamesPlayed(8, 10);

        expect(service.userProfile().totalGames).toBe(2);
        expect(service.userProfile().accuracyPct).toBe(40);
    });
});
