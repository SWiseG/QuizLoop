import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { LifeService } from '../../core/services/life.service';
import { AdService } from '../../core/services/ad.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    standalone: true,
    imports: [IonContent, CommonModule, TranslateModule]
})
export class HomePage {
    private quizState = inject(QuizStateService);
    private userService = inject(UserProfileService);
    private router = inject(Router);
    private lifeService = inject(LifeService);
    private adService = inject(AdService);

    user = this.userService.userProfile;
    lives = this.lifeService.lives;
    maxLives = this.lifeService.maxLives;
    canPlay = this.lifeService.canPlay;
    timeUntilNextLife = this.lifeService.timeUntilNextLife;
    regenCountdown = computed(() => this.formatCountdown(this.timeUntilNextLife()));

    startDailyChallenge() {
        this.quizState.startNewRound('Daily');
    }

    openModeSelect() {
        this.router.navigateByUrl('/mode-select');
    }

    openSettings() {
        this.router.navigateByUrl('/settings');
    }

    async watchLifeAd(event?: Event) {
        event?.stopPropagation();

        const result = await this.adService.showRewarded('life');
        if (result) {
            this.lifeService.addLife();
        }
    }

    private formatCountdown(ms: number): string {
        if (ms <= 0) {
            return '00:00';
        }

        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}
