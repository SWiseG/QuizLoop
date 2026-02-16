import { Injectable, inject, signal, computed } from '@angular/core';
import { Question } from '../models/quiz.models';
import { QuestionService } from './question.service';
import { UserProfileService } from './user-profile.service';
import { Router } from '@angular/router';
import { AnalyticsService } from './analytics.service';
import { AdService } from './ad.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class QuizStateService {
    private readonly http = inject(HttpClient, { optional: true });
    private readonly auth = inject(AuthService);
    private readonly submitScoreUrl = `${environment.apiUrl}/leaderboard/submit`;

    // State signals
    questions = signal<Question[]>([]);
    currentIndex = signal(0);
    score = signal(0);
    correctCount = signal(0);
    isRoundComplete = signal(false);
    timeLeft = signal(15);
    selectedAnswer = signal<number | null>(null);
    isAnswerLocked = signal(false);
    currentMode = signal('classic');

    // Computed
    currentQuestion = computed(() => this.questions()[this.currentIndex()]);
    progress = computed(() => {
        const total = this.questions().length;
        return total > 0 ? (this.currentIndex() + 1) / total : 0;
    });
    totalQuestions = computed(() => this.questions().length);

    private timerInterval?: ReturnType<typeof setInterval>;

    constructor(
        private questionService: QuestionService,
        private userService: UserProfileService,
        private router: Router,
        private analytics: AnalyticsService,
        private adService: AdService
    ) { }

    startNewRound(mode?: string) {
        const resolvedMode = mode?.trim() || 'classic';
        this.currentMode.set(resolvedMode);

        this.questionService.getQuestions(resolvedMode).subscribe(qs => {
            this.questions.set(qs);
            this.currentIndex.set(0);
            this.score.set(0);
            this.correctCount.set(0);
            this.isRoundComplete.set(false);
            this.selectedAnswer.set(null);
            this.isAnswerLocked.set(false);
            this.startTimer();
            this.router.navigateByUrl('/quiz');
            void this.analytics.logEvent('quiz_start', { category: resolvedMode, mode: resolvedMode });
        });
    }

    answerQuestion(index: number) {
        if (this.isAnswerLocked()) return; // Prevent double-tap
        this.isAnswerLocked.set(true);
        this.selectedAnswer.set(index);
        this.stopTimer();

        const question = this.currentQuestion();
        const isCorrect = !!question && index === question.correctIndex;

        if (isCorrect) {
            this.correctCount.update(c => c + 1);
            this.score.update(s => s + 100 + (this.timeLeft() * 10)); // Speed bonus
        }
        void this.analytics.logEvent('question_answered', {
            question_id: this.currentIndex(),
            is_correct: isCorrect,
            time_remaining: this.timeLeft()
        });

        // Delay before moving to next question (visual feedback)
        setTimeout(() => {
            this.selectedAnswer.set(null);
            this.isAnswerLocked.set(false);

            if (this.currentIndex() < this.questions().length - 1) {
                this.currentIndex.update(i => i + 1);
                this.startTimer();
            } else {
                this.completeRound();
            }
        }, 1200);
    }

    private completeRound() {
        this.isRoundComplete.set(true);
        this.stopTimer();
        const total = this.questions().length;
        const correct = this.correctCount();
        const won = correct >= Math.ceil(total / 2);
        this.userService.updateStreak(won);
        this.userService.addCoins(Math.floor(this.score() / 10));
        this.userService.incrementGamesPlayed(correct, total);
        this.adService.incrementRoundsPlayed();
        void this.analytics.logEvent('quiz_complete', {
            score: this.score(),
            correct_count: this.correctCount(),
            total_questions: this.totalQuestions()
        });
        void this.submitRoundResult();
        this.router.navigateByUrl('/results');
    }

    private async submitRoundResult(): Promise<void> {
        if (!this.http || !this.auth.isAuthenticated()) {
            return;
        }

        try {
            const token = await this.getFirebaseIdToken();
            if (!token) {
                return;
            }

            const request: SubmitScoreRequest = {
                mode: this.currentMode(),
                score: this.score(),
                correctCount: this.correctCount()
            };

            await firstValueFrom(
                this.http.post(this.submitScoreUrl, request, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            );
        } catch {
            // Keep local flow even when backend score submit fails.
        }
    }

    private async getFirebaseIdToken(): Promise<string | null> {
        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.getIdToken();
            return result.token;
        } catch {
            return null;
        }
    }

    private startTimer() {
        this.timeLeft.set(15);
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            const current = this.timeLeft();
            if (current <= 1) {
                this.timeLeft.set(0);
                this.stopTimer();
                // Timeout = wrong answer (index -1 won't match any correctIndex)
                if (!this.isAnswerLocked()) {
                    this.answerQuestion(-1);
                }
            } else {
                this.timeLeft.set(current - 1);
            }
        }, 1000);
    }

    private stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = undefined;
        }
    }
}

interface SubmitScoreRequest {
    mode: string;
    score: number;
    correctCount: number;
}
