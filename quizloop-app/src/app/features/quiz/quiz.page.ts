import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { QuizStateService } from '../../core/services/quiz-state.service';

@Component({
    selector: 'app-quiz',
    templateUrl: './quiz.page.html',
    styleUrls: ['./quiz.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, CommonModule, TranslateModule]
})
export class QuizPage {
    quizState = inject(QuizStateService);

    currentQuestion = this.quizState.currentQuestion;
    currentIndex = this.quizState.currentIndex;
    questions = this.quizState.questions;
    timeLeft = this.quizState.timeLeft;
    progress = this.quizState.progress;

    selectAnswer(index: number) {
        this.quizState.answerQuestion(index);
    }

    useHint() {
        console.log('Hint requested');
    }
}
