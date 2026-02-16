import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { QuizStateService } from '../services/quiz-state.service';

export const quizSessionGuard: CanActivateFn = () => {
    const quizState = inject(QuizStateService);
    const router = inject(Router);

    return quizState.questions().length > 0
        ? true
        : router.createUrlTree(['/home']);
};

export const resultsSessionGuard: CanActivateFn = () => {
    const quizState = inject(QuizStateService);
    const router = inject(Router);

    return quizState.isRoundComplete()
        ? true
        : router.createUrlTree(['/home']);
};
