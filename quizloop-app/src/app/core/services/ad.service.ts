import { Injectable, inject, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AnalyticsService } from './analytics.service';

@Injectable({ providedIn: 'root' })
export class AdService {
    private analytics = inject(AnalyticsService);

    // Ad caps (will be Remote Config later)
    private interstitialCooldownSeconds = 90;
    private maxInterstitialsPerSession = 2;
    private minRoundsBeforeFirstInterstitial = 1;

    // Internal state
    private interstitialCount = 0;
    private lastInterstitialTime = 0;
    private roundsPlayed = 0;
    adsEnabled = signal(true); // Kill switch

    async initialize(): Promise<void> {
        try {
            const { AdMob } = await import('@capacitor-community/admob');
            await AdMob.initialize({
                initializeForTesting: !environment.production,
            });
            console.log('[AdService] AdMob initialized');
        } catch {
            console.log('[AdService] AdMob not available (web environment)');
        }
    }

    async showBanner(): Promise<void> {
        if (!this.adsEnabled()) return;
        try {
            const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
            await AdMob.showBanner({
                adId: environment.admob.bannerId,
                adSize: BannerAdSize.ADAPTIVE_BANNER,
                position: BannerAdPosition.BOTTOM_CENTER,
                isTesting: !environment.production,
            });
            this.analytics.logEvent('banner_impression');
        } catch {
            console.log('[AdService] Banner not available (web environment)');
        }
    }

    async hideBanner(): Promise<void> {
        try {
            const { AdMob } = await import('@capacitor-community/admob');
            await AdMob.hideBanner();
        } catch { /* web fallback */ }
    }

    incrementRoundsPlayed(): void {
        this.roundsPlayed++;
    }

    canShowInterstitial(): boolean {
        if (!this.adsEnabled()) return false;
        if (this.roundsPlayed < this.minRoundsBeforeFirstInterstitial) return false;
        if (this.interstitialCount >= this.maxInterstitialsPerSession) return false;
        const elapsed = (Date.now() - this.lastInterstitialTime) / 1000;
        if (this.lastInterstitialTime > 0 && elapsed < this.interstitialCooldownSeconds) return false;
        return true;
    }

    async showInterstitial(): Promise<void> {
        if (!this.canShowInterstitial()) return;
        try {
            const { AdMob } = await import('@capacitor-community/admob');
            await AdMob.prepareInterstitial({
                adId: environment.admob.interstitialId,
                isTesting: !environment.production,
            });
            await AdMob.showInterstitial();
            this.interstitialCount++;
            this.lastInterstitialTime = Date.now();
            this.analytics.logEvent('interstitial_shown', { screen: 'results' });
        } catch {
            console.log('[AdService] Interstitial not available (web environment)');
        }
    }

    async showRewarded(rewardType: string): Promise<any> {
        if (!this.adsEnabled()) return null;
        try {
            const { AdMob } = await import('@capacitor-community/admob');
            await AdMob.prepareRewardVideoAd({
                adId: environment.admob.rewardedId,
                isTesting: !environment.production,
            });
            const result = await AdMob.showRewardVideoAd();
            this.analytics.logEvent('rewarded_ad_watched', { reward_type: rewardType });
            return result;
        } catch {
            // Web/dev fallback: simulate watching a rewarded ad
            if (!environment.production) {
                console.log(`[AdService] Simulating rewarded ad for: ${rewardType}`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                console.log(`[AdService] Rewarded ad completed (dev simulation)`);
                return { type: 'dev-simulated', rewardType };
            }
            return null;
        }
    }
}
