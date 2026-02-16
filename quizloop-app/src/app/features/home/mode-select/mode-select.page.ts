import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { QuizStateService } from '../../../core/services/quiz-state.service';
import { LifeService } from '../../../core/services/life.service';
import { AdService } from '../../../core/services/ad.service';

@Component({
    selector: 'app-mode-select',
    templateUrl: './mode-select.page.html',
    styleUrls: ['./mode-select.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, CommonModule, TranslateModule]
})
export class ModeSelectPage {
    private quizState = inject(QuizStateService);
    private lifeService = inject(LifeService);
    private adService = inject(AdService);

    lives = this.lifeService.lives;
    maxLives = this.lifeService.maxLives;
    canPlay = this.lifeService.canPlay;
    timeUntilNextLife = this.lifeService.timeUntilNextLife;
    regenCountdown = computed(() => this.formatCountdown(this.timeUntilNextLife()));

    selectMode(mode: string) {
        this.quizState.startNewRound(mode);
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
