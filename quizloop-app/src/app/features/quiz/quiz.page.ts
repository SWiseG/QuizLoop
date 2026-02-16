import { Component, effect, inject } from '@angular/core';
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
    isAnswerLocked = this.quizState.isAnswerLocked;

    hintUsed = false;
    hiddenOptionIndices: number[] = [];

    constructor() {
        effect(() => {
            this.currentIndex();
            this.hintUsed = false;
            this.hiddenOptionIndices = [];
        });
    }

    selectAnswer(index: number) {
        if (this.hiddenOptionIndices.includes(index)) {
            return;
        }

        this.quizState.answerQuestion(index);
    }

    useHint() {
        const question = this.currentQuestion();
        if (!question || this.hintUsed || this.isAnswerLocked()) {
            return;
        }

        const wrongIndices = question.options
            .map((_, index) => index)
            .filter(index => index !== question.correctIndex);

        const shuffled = [...wrongIndices].sort(() => Math.random() - 0.5);
        this.hiddenOptionIndices = shuffled.slice(0, 2);
        this.hintUsed = true;
    }

    isOptionHidden(index: number): boolean {
        return this.hiddenOptionIndices.includes(index);
    }
}
