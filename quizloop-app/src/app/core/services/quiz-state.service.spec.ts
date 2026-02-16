import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { Question } from '../models/quiz.models';
import { QuizStateService } from './quiz-state.service';
import { QuestionService } from './question.service';
import { UserProfileService } from './user-profile.service';
import { AnalyticsService } from './analytics.service';
import { AdService } from './ad.service';

describe('QuizStateService', () => {
    let service: QuizStateService;
    let userProfileService: UserProfileService;
    let questionServiceSpy: jasmine.SpyObj<QuestionService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let analyticsSpy: jasmine.SpyObj<AnalyticsService>;
    let adServiceSpy: jasmine.SpyObj<AdService>;

    const questionA: Question = {
        id: 'q-1',
        category: 'Science',
        text: 'Question A',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 1,
        difficulty: 'easy'
    };

    const questionB: Question = {
        id: 'q-2',
        category: 'History',
        text: 'Question B',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        difficulty: 'easy'
    };

    function setBaseProfile(overrides: Partial<ReturnType<UserProfileService['userProfile']>> = {}): void {
        userProfileService.userProfile.set({
            id: 'test-user',
            createdAt: new Date().toISOString(),
            locale: 'en-US',
            streakCurrent: 0,
            streakBest: 0,
            totalGames: 0,
            accuracyPct: 0,
            coins: 0,
            hasPremium: false,
            ...overrides
        });
    }

    function startRound(questions: Question[]): void {
        questionServiceSpy.getQuestions.and.returnValue(of(questions));
        service.startNewRound('classic');
    }

    beforeEach(() => {
        questionServiceSpy = jasmine.createSpyObj<QuestionService>('QuestionService', ['getQuestions']);
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['logEvent']);
        adServiceSpy = jasmine.createSpyObj<AdService>('AdService', ['incrementRoundsPlayed']);

        analyticsSpy.logEvent.and.resolveTo();

        TestBed.configureTestingModule({
            providers: [
                QuizStateService,
                UserProfileService,
                { provide: QuestionService, useValue: questionServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: AnalyticsService, useValue: analyticsSpy },
                { provide: AdService, useValue: adServiceSpy }
            ]
        });

        service = TestBed.inject(QuizStateService);
        userProfileService = TestBed.inject(UserProfileService);
    });

    afterEach(() => {
        (service as any).stopTimer();
    });

    describe('scoring', () => {
        it('adds 200 points for a correct answer with 10 seconds left', fakeAsync(() => {
            setBaseProfile();
            startRound([questionA]);

            service.timeLeft.set(10);
            service.answerQuestion(1);

            expect(service.score()).toBe(200);
            tick(1200);
        }));

        it('adds 100 points for a correct answer with 0 seconds left', fakeAsync(() => {
            setBaseProfile();
            startRound([questionA]);

            service.timeLeft.set(0);
            service.answerQuestion(1);

            expect(service.score()).toBe(100);
            tick(1200);
        }));

        it('adds 0 points for an incorrect answer', fakeAsync(() => {
            setBaseProfile();
            startRound([questionA]);

            service.timeLeft.set(10);
            service.answerQuestion(0);

            expect(service.score()).toBe(0);
            tick(1200);
        }));

        it('accumulates score across multiple correct answers', fakeAsync(() => {
            setBaseProfile();
            startRound([questionA, questionB]);

            service.timeLeft.set(10); // +200
            service.answerQuestion(1);
            expect(service.score()).toBe(200);
            tick(1200);

            service.timeLeft.set(5); // +150
            service.answerQuestion(0);
            expect(service.score()).toBe(350);
            tick(1200);
        }));
    });

    describe('streak logic', () => {
        it('increments streakCurrent on a winning round', fakeAsync(() => {
            setBaseProfile({ streakCurrent: 2, streakBest: 4 });
            startRound([questionA]);

            service.answerQuestion(1);
            tick(1200);

            expect(userProfileService.userProfile().streakCurrent).toBe(3);
        }));

        it('updates streakBest when a win beats the previous best', fakeAsync(() => {
            setBaseProfile({ streakCurrent: 12, streakBest: 12 });
            startRound([questionA]);

            service.answerQuestion(1);
            tick(1200);

            expect(userProfileService.userProfile().streakBest).toBe(13);
        }));

        it('resets streakCurrent to 0 on a losing round', fakeAsync(() => {
            setBaseProfile({ streakCurrent: 5, streakBest: 8 });
            startRound([questionA]);

            service.answerQuestion(0);
            tick(1200);

            expect(userProfileService.userProfile().streakCurrent).toBe(0);
        }));

        it('does not reduce streakBest on a losing round', fakeAsync(() => {
            setBaseProfile({ streakCurrent: 5, streakBest: 8 });
            startRound([questionA]);

            service.answerQuestion(0);
            tick(1200);

            expect(userProfileService.userProfile().streakBest).toBe(8);
        }));
    });

    describe('round completion', () => {
        it('sets isRoundComplete to true when completeRound executes', () => {
            setBaseProfile();
            service.questions.set([questionA]);
            service.correctCount.set(1);
            service.score.set(200);

            (service as any).completeRound();

            expect(service.isRoundComplete()).toBeTrue();
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/results');
        });

        it('adds floor(score / 10) coins on round completion', () => {
            setBaseProfile({ coins: 100 });
            service.questions.set([questionA]);
            service.correctCount.set(1);
            service.score.set(155);

            (service as any).completeRound();

            expect(userProfileService.userProfile().coins).toBe(115);
        });
    });

    describe('timer', () => {
        beforeEach(() => {
            jasmine.clock().install();
        });

        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('starts at 15 seconds for a new round', () => {
            setBaseProfile();
            startRound([questionA]);

            expect(service.timeLeft()).toBe(15);
        });

        it('auto-answers with -1 when timer reaches 0 and answer is not locked', () => {
            setBaseProfile();
            const answerSpy = spyOn(service, 'answerQuestion').and.callThrough();
            startRound([questionA]);

            jasmine.clock().tick(15000);

            expect(answerSpy).toHaveBeenCalledWith(-1);
            jasmine.clock().tick(1200);
        });
    });
});
