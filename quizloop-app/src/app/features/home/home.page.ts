import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { UserProfileService } from '../../core/services/user-profile.service';

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

    user = this.userService.userProfile;

    startDailyChallenge() {
        this.quizState.startNewRound('Daily');
    }

    openModeSelect() {
        this.router.navigateByUrl('/mode-select');
    }
}
