import { TestBed } from '@angular/core/testing';
import { AdService } from './ad.service';
import { AnalyticsService } from './analytics.service';

describe('AdService', () => {
    let service: AdService;
    let analyticsSpy: jasmine.SpyObj<AnalyticsService>;

    beforeEach(() => {
        analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['logEvent']);
        analyticsSpy.logEvent.and.resolveTo();

        TestBed.configureTestingModule({
            providers: [
                AdService,
                { provide: AnalyticsService, useValue: analyticsSpy }
            ]
        });

        service = TestBed.inject(AdService);
    });

    it('returns false when roundsPlayed is below 1', () => {
        expect(service.canShowInterstitial()).toBeFalse();
    });

    it('returns true when roundsPlayed is at least 1 and there are no blockers', () => {
        service.incrementRoundsPlayed();

        expect(service.canShowInterstitial()).toBeTrue();
    });

    it('returns false after max interstitials per session has been reached', () => {
        service.incrementRoundsPlayed();
        (service as any).interstitialCount = 2;

        expect(service.canShowInterstitial()).toBeFalse();
    });

    it('returns false during the 90-second cooldown window', () => {
        service.incrementRoundsPlayed();
        (service as any).interstitialCount = 1;
        (service as any).lastInterstitialTime = Date.now() - 89_000;

        expect(service.canShowInterstitial()).toBeFalse();
    });

    it('returns false when adsEnabled kill switch is false', () => {
        service.incrementRoundsPlayed();
        service.adsEnabled.set(false);

        expect(service.canShowInterstitial()).toBeFalse();
    });

    it('incrementRoundsPlayed increments internal rounds counter', () => {
        expect((service as any).roundsPlayed).toBe(0);
        service.incrementRoundsPlayed();
        expect((service as any).roundsPlayed).toBe(1);
    });
});
