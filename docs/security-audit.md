# Security Audit - QuizLoop

Date: 2026-02-16

## Passed ✅

- Hardcoded secret scan found no unexpected credentials/tokens in `quizloop-app/src` or `backend`.
- Expected placeholders are present:
  - `quizloop-app/src/environments/environment.ts` uses `PLACEHOLDER_DEV_API_KEY`.
  - `quizloop-app/src/environments/environment.ts` uses official AdMob test IDs (`ca-app-pub-3940256099942544/*`).
  - `quizloop-app/src/environments/environment.prod.ts` uses placeholder production values (`REPLACE_WITH_*`).
  - `backend/QuizLoop.Api/appsettings.json` uses Firebase project id `quizloop-dev`.
- No `debugger;` statements found in frontend/backend source.
- Ad policy guardrails exist in code:
  - Interstitial capping: `maxInterstitialsPerSession = 2` in `quizloop-app/src/app/core/services/ad.service.ts`.
  - Interstitial cooldown: `interstitialCooldownSeconds = 90` in `quizloop-app/src/app/core/services/ad.service.ts`.
  - Kill switch: `adsEnabled` signal in `quizloop-app/src/app/core/services/ad.service.ts`.
  - Rewarded ads are optional and user-triggered from `quizloop-app/src/app/features/rewards/rewards.page.ts`.
  - No interstitial trigger is present in quiz gameplay flow (`quizloop-app/src/app/features/quiz`).

## Warnings ⚠️

- `console.log` statements exist in app code for analytics/ad/auth fallbacks and UI actions. No direct password/token leaks were detected, but logs should be reviewed for production noise:
  - `quizloop-app/src/app/core/services/ad.service.ts`
  - `quizloop-app/src/app/core/services/analytics.service.ts`
  - `quizloop-app/src/app/core/services/auth.service.ts`
  - `quizloop-app/src/app/features/quiz/quiz.page.ts`
  - `quizloop-app/src/app/features/results/results.page.ts`
  - `quizloop-app/src/app/features/premium/premium.page.ts`
  - `quizloop-app/src/app/features/rewards/rewards.page.ts`
- Informational TODOs/FIXMEs (non-blocking security):
  - `quizloop-app/src/app/core/services/question.service.ts` (live API switch)
  - `quizloop-app/src/app/features/settings/settings.page.ts` (data deletion trigger implementation)
  - `quizloop-app/src/app/features/premium/premium.page.ts` (IAP integration)
  - `quizloop-app/src/app/features/rewards/rewards.page.ts` (life reward implementation)

## Action Required 🔴

- Tighten CORS before production release:
  - Current policy in `backend/QuizLoop.Api/Program.cs` uses `AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()` under policy `"dev"`.
  - Restrict allowed origins/headers/methods per production domains and mobile app requirements.
- Replace environment placeholders before store release:
  - Firebase production credentials in `quizloop-app/src/environments/environment.prod.ts`.
  - AdMob production unit ids in `quizloop-app/src/environments/environment.prod.ts`.
- Confirm interstitial placement in results flow only once results-page ad invocation is wired (currently no direct app-level call found outside service).
