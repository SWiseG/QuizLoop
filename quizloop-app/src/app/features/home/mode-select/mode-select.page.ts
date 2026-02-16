import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { QuizStateService } from '../../../core/services/quiz-state.service';

@Component({
    selector: 'app-mode-select',
    templateUrl: './mode-select.page.html',
    styleUrls: ['./mode-select.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, CommonModule, TranslateModule]
})
export class ModeSelectPage {
    private quizState = inject(QuizStateService);

    selectMode(mode: string) {
        this.quizState.startNewRound(mode);
    }
}
