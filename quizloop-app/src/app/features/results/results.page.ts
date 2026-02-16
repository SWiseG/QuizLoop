import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { UserProfileService } from '../../core/services/user-profile.service';

@Component({
    selector: 'app-results',
    templateUrl: './results.page.html',
    styleUrls: ['./results.page.scss'],
    standalone: true,
    imports: [IonContent, CommonModule, TranslateModule]
})
export class ResultsPage {
    private quizState = inject(QuizStateService);
    private userService = inject(UserProfileService);
    private router = inject(Router);

    score = this.quizState.score;
    correctCount = this.quizState.correctCount;
    totalQuestions = this.quizState.totalQuestions;
    user = this.userService.userProfile;

    playAgain() {
        this.router.navigateByUrl('/home');
    }

    shareResult() {
        const text = `I scored ${this.score()} points on QuizLoop! 🧠🔥 ${this.correctCount()}/${this.totalQuestions()} correct!`;
        if (navigator.share) {
            navigator.share({ title: 'QuizLoop', text });
        } else {
            console.log('Share:', text);
        }
    }
}
