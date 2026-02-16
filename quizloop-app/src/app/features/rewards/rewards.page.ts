import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { AdService } from 'src/app/core/services/ad.service';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { LifeService } from 'src/app/core/services/life.service';

@Component({
    selector: 'app-rewards',
    templateUrl: './rewards.page.html',
    styleUrls: ['./rewards.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, CommonModule, TranslateModule]
})
export class RewardsPage {
    private adService = inject(AdService);
    private userService = inject(UserProfileService);
    private analytics = inject(AnalyticsService);
    private lifeService = inject(LifeService);

    user = this.userService.userProfile;
    lives = this.lifeService.lives;
    maxLives = this.lifeService.maxLives;
    canPlay = this.lifeService.canPlay;

    async watchAd(rewardType: string) {
        if (rewardType === 'life' && this.lives() >= this.maxLives) {
            return;
        }

        await this.analytics.logEvent('rewarded_offer_shown', { reward_type: rewardType });
        const result = await this.adService.showRewarded(rewardType);

        if (!result) return;

        if (rewardType === 'coins') {
            this.userService.addCoins(500);
        }

        if (rewardType === 'life') {
            this.lifeService.addLife();
        }
    }

}
