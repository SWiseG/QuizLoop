import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

export type AnalyticsEvent =
    | 'app_open'
    | 'onboarding_complete'
    | 'quiz_start'
    | 'question_answered'
    | 'quiz_complete'
    | 'rewarded_offer_shown'
    | 'rewarded_ad_watched'
    | 'interstitial_shown'
    | 'banner_impression'
    | 'purchase_started'
    | 'purchase_completed';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private auth = inject(AuthService);
    private sessionId = crypto.randomUUID();
    private appVersion = environment.appVersion;

    async logEvent(event: AnalyticsEvent, params: Record<string, any> = {}): Promise<void> {
        const enrichedParams = {
            ...params,
            user_id: this.auth.userId() ?? 'unknown',
            session_id: this.sessionId,
            timestamp: new Date().toISOString(),
            app_version: this.appVersion,
        };

        if (environment.production) {
            try {
                const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
                await FirebaseAnalytics.logEvent({ name: event, params: enrichedParams });
            } catch {
                console.log(`[Analytics] ${event}`, enrichedParams);
            }
        } else {
            console.log(`[Analytics] ${event}`, enrichedParams);
        }
    }

    async setScreen(screenName: string): Promise<void> {
        if (environment.production) {
            try {
                const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
                await FirebaseAnalytics.setCurrentScreen({ screenName, screenClassOverride: screenName });
            } catch {
                console.log(`[Analytics] Screen: ${screenName}`);
            }
        } else {
            console.log(`[Analytics] Screen: ${screenName}`);
        }
    }
}
