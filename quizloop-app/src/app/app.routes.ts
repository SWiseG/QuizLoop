import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () =>
      import('./features/onboarding/splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'consent',
    loadComponent: () =>
      import('./features/onboarding/consent/consent.page').then((m) => m.ConsentPage),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/onboarding/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'mode-select',
    loadComponent: () =>
      import('./features/home/mode-select/mode-select.page').then((m) => m.ModeSelectPage),
  },
  {
    path: 'quiz',
    loadComponent: () =>
      import('./features/quiz/quiz.page').then((m) => m.QuizPage),
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./features/results/results.page').then((m) => m.ResultsPage),
  },
  {
    path: 'rewards',
    loadComponent: () =>
      import('./features/rewards/rewards.page').then((m) => m.RewardsPage),
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./features/leaderboard/leaderboard.page').then((m) => m.LeaderboardPage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'premium',
    loadComponent: () =>
      import('./features/premium/premium.page').then((m) => m.PremiumPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./features/settings/privacy-policy/privacy-policy.page').then((m) => m.PrivacyPolicyPage),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/settings/terms/terms.page').then((m) => m.TermsPage),
  },
];
