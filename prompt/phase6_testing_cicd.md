# Prompt: Phase 6 — Testing & CI/CD

You are working on the **QuizLoop** mobile app project. Your job is to implement comprehensive tests and a GitHub Actions CI pipeline. Read the entire prompt before writing any code.

---

## Project Context

| Item | Value |
|---|---|
| **Frontend** | Angular 20, Ionic 8, Capacitor 8.1 — directory: `c:\Projects\QuizLoop\quizloop-app` |
| **Backend** | ASP.NET Core 10 (.NET 10) — directory: `c:\Projects\QuizLoop\backend` |
| **State** | Angular Signals (no NgRx) |
| **Test framework (frontend)** | Karma + Jasmine (already installed, configured in `karma.conf.js` and `angular.json`) |
| **Test framework (backend)** | xUnit (to be created) |
| **Existing spec files** | Only `src/app/app.component.spec.ts` exists (basic "should create" test) |
| **Backend test project** | Does NOT exist — you must create it |
| **`.github` folder** | Does NOT exist — you must create it |
| **Solution file** | `backend/QuizLoop.slnx` exists but is EMPTY — do not rely on it. Build with `dotnet build QuizLoop.Api\QuizLoop.Api.csproj` |

### What the Spec Doc Requires

From `docs/PROMPT_FOR_DEV_AI.md`, section "Quality and Testing Requirements":

1. Unit tests for **quiz scoring logic**, **streak logic**, **ad gating logic**
2. Widget tests for **onboarding/home/quiz/results** flows
3. Integration test for **happy path**: open app → play round → result → rewarded action
4. Crash-free startup test
5. Basic performance check: no frame drops on quiz transitions

From "CI/CD Requirements":

1. GitHub Actions: Angular analyze, Angular test, build APK/IPA (or platform-specific artifact)
2. Fastlane lanes: internal testing deploy, production deploy scaffold

---

## Architecture of Key Services (for test targeting)

### `QuizStateService` (`src/app/core/services/quiz-state.service.ts`)

This is the **core quiz engine** that you will test most heavily.

| Property/Method | Type | Description |
|---|---|---|
| `questions` | `signal<Question[]>` | Current round questions |
| `currentIndex` | `signal<number>` | Current question index |
| `score` | `signal<number>` | Running score |
| `correctCount` | `signal<number>` | Number of correct answers |
| `isRoundComplete` | `signal<boolean>` | Whether the round is finished |
| `timeLeft` | `signal<number>` | Countdown timer (15 → 0) |
| `selectedAnswer` | `signal<number \| null>` | Currently selected answer |
| `isAnswerLocked` | `signal<boolean>` | Prevents double-tap |
| `currentQuestion` | `computed` | `questions()[currentIndex()]` |
| `progress` | `computed` | `(currentIndex() + 1) / questions().length` |
| `totalQuestions` | `computed` | `questions().length` |
| `startNewRound(mode?)` | method | Fetches questions, resets state, starts timer |
| `answerQuestion(index)` | method | Records answer, calculates score with speed bonus: `100 + (timeLeft * 10)` |
| `completeRound()` | private | Updates streaks, coins, increments games, navigates to results |

**Scoring formula:** `100 + (timeLeft * 10)` per correct answer. Incorrect answers add 0.  
**Streak logic:** Won if `correctCount >= ceil(totalQuestions / 2)`.  
**Coins earned:** `floor(score / 10)`.

### `UserProfileService` (`src/app/core/services/user-profile.service.ts`)

| Method | Logic |
|---|---|
| `updateStreak(won: boolean)` | If won: `streakCurrent++`, `streakBest = max(new, best)`. If lost: `streakCurrent = 0` |
| `addCoins(amount)` | `coins += floor(amount)` |
| `incrementGamesPlayed(correct, total)` | Increments `totalGames`, recalculates rolling accuracy |

### `AdService` (`src/app/core/services/ad.service.ts`)

**Ad gating rules to test:**

| Rule | Value |
|---|---|
| `minRoundsBeforeFirstInterstitial` | 1 (no interstitial until at least 1 round played) |
| `maxInterstitialsPerSession` | 2 |
| `interstitialCooldownSeconds` | 90 |
| `adsEnabled` | Signal, defaults to `true`. Kill switch. |

Method `canShowInterstitial()` returns `false` if:

- `adsEnabled()` is `false`
- `roundsPlayed < minRoundsBeforeFirstInterstitial`
- `interstitialCount >= maxInterstitialsPerSession`
- Less than 90 seconds since last interstitial

### `ConsentService` (`src/app/core/services/consent.service.ts`)

- `accept()` → sets `consentStatus` signal to `'accepted'`, persists to `localStorage`
- `decline()` → sets to `'declined'`
- `hasConsented()` → returns `consentStatus() === 'accepted'`

### `TranslationService` (`src/app/core/services/translation.service.ts`)

- `setLanguage(lang)` → validates against `['en-US', 'pt-BR']`, falls back to `'en-US'`
- Persists to `localStorage` key `'ql_language'`
- `currentLanguage` signal

### Backend Controllers

**`LeaderboardController`** (`backend/QuizLoop.Api/Controllers/LeaderboardController.cs`):

- `GET /api/leaderboard?period=daily|weekly|alltime` — anonymous, returns top 50 grouped by UserId
- `POST /api/leaderboard/submit` — `[Authorize]`, creates a `Round` entity

**`UserSyncController`** (`backend/QuizLoop.Api/Controllers/UserSyncController.cs`):

- `GET /api/user/profile` — `[Authorize]`, auto-creates profile if not found
- `POST /api/user/sync` — `[Authorize]`, merges with `Math.Max` for streakBest/totalGames/coins

**`AppDbContext`** (`backend/QuizLoop.Infrastructure/Persistence/AppDbContext.cs`):

- DbSets: `Users`, `Questions`, `Rounds`, `AdEvents`, `Purchases`
- Uses SQLite

---

## Task 1: Frontend Unit Tests (Karma + Jasmine)

Create spec files in the same directory as their source files, following Angular convention.

> [!IMPORTANT]
> All services use Angular Signals and `inject()`. When testing services with `inject()`, use `TestBed.configureTestingModule`. Services that use dynamic imports (like `AdService`, `AuthService`) should have those imports mocked.

### 1A. `quiz-state.service.spec.ts`

**File:** `src/app/core/services/quiz-state.service.spec.ts`

Test the following scenarios:

**Scoring tests:**

- A correct answer with `timeLeft = 10` should add `100 + (10 * 10) = 200` points
- A correct answer with `timeLeft = 0` should add `100 + (0 * 10) = 100` points
- An incorrect answer should add 0 points
- Multiple correct answers should accumulate score correctly

**Streak tests:**

- Winning a round (`correctCount >= ceil(total/2)`) should increment `streakCurrent`
- Winning should update `streakBest` if new streak > best
- Losing should reset `streakCurrent` to 0
- Losing should NOT change `streakBest`

**Round completion tests:**

- `completeRound` should set `isRoundComplete` to `true`
- Coins should be `floor(score / 10)`

**Timer tests:**

- Timer starts at 15
- When timer hits 0 and answer is not locked, it auto-answers with index -1 (timeout = wrong)

**Implementation notes:**

- Mock `QuestionService.getQuestions()` to return a fixed array of `Question` objects
- Mock `Router.navigateByUrl()` as a spy
- Mock `AnalyticsService.logEvent()` as a spy
- Mock `AdService.incrementRoundsPlayed()` as a spy
- Use `jasmine.clock().install()` and `jasmine.clock().tick()` for timer tests
- Use `fakeAsync` and `tick` from `@angular/core/testing` for setTimeout handling

### 1B. `user-profile.service.spec.ts`

**File:** `src/app/core/services/user-profile.service.spec.ts`

Test:

- `updateStreak(true)` increments `streakCurrent` and updates `streakBest` when applicable
- `updateStreak(false)` resets `streakCurrent` to 0 but does not reduce `streakBest`
- `addCoins(500)` adds 500, `addCoins(99.7)` adds 99 (floor)
- `incrementGamesPlayed(8, 10)` increments `totalGames` and recalculates accuracy

### 1C. `ad.service.spec.ts`

**File:** `src/app/core/services/ad.service.spec.ts`

Test `canShowInterstitial()`:

- Returns `false` when `roundsPlayed < 1`
- Returns `true` when `roundsPlayed >= 1` and no other blockers
- Returns `false` after showing `maxInterstitialsPerSession` (2) interstitials
- Returns `false` within cooldown period (90 seconds)
- Returns `false` when `adsEnabled` signal is set to `false`
- `incrementRoundsPlayed()` increments internal counter

**Implementation notes:**

- Mock the dynamic `import('@capacitor-community/admob')` — don't import the actual plugin
- Mock `AnalyticsService` as a spy
- For cooldown, manipulate `Date.now()` with `jasmine.clock()` or spy on `Date.now`

### 1D. `consent.service.spec.ts`

**File:** `src/app/core/services/consent.service.spec.ts`

Test:

- Default status is `'unknown'` on fresh start (clear localStorage before each test)
- `accept()` sets signal to `'accepted'` and persists to localStorage
- `decline()` sets signal to `'declined'` and persists
- `hasConsented()` returns `true` only when accepted
- On service creation, loads persisted value from localStorage

### 1E. `translation.service.spec.ts`

**File:** `src/app/core/services/translation.service.spec.ts`

Test:

- `setLanguage('pt-BR')` changes signal and persists to localStorage
- `setLanguage('invalid')` falls back to `'en-US'`
- On creation, reads from localStorage if available
- On creation, detects browser language (mock `navigator.language`)

**Implementation notes:**

- Mock `TranslateService` from `@ngx-translate/core` (methods: `addLangs`, `setDefaultLang`, `use`)

---

## Task 2: Backend Integration Tests (xUnit)

### 2A. Create Test Project

Run from `c:\Projects\QuizLoop\backend`:

```powershell
dotnet new xunit -n QuizLoop.Tests -o QuizLoop.Tests
dotnet add QuizLoop.Tests/QuizLoop.Tests.csproj reference QuizLoop.Api/QuizLoop.Api.csproj
dotnet add QuizLoop.Tests/QuizLoop.Tests.csproj reference QuizLoop.Infrastructure/QuizLoop.Infrastructure.csproj
dotnet add QuizLoop.Tests/QuizLoop.Tests.csproj reference QuizLoop.Domain/QuizLoop.Domain.csproj
dotnet add QuizLoop.Tests/QuizLoop.Tests.csproj package Microsoft.AspNetCore.Mvc.Testing
dotnet add QuizLoop.Tests/QuizLoop.Tests.csproj package Microsoft.EntityFrameworkCore.InMemory
```

### 2B. Create `TestWebApplicationFactory.cs`

**File:** `backend/QuizLoop.Tests/TestWebApplicationFactory.cs`

Create a `WebApplicationFactory<Program>` subclass that:

- Replaces `AppDbContext` registration with InMemory database
- Adds a test authentication handler that creates a fake authenticated user with `ClaimTypes.NameIdentifier = "test-user-123"`
- Configures authentication scheme to default to the test handler

> [!IMPORTANT]
> `Program.cs` uses top-level statements. You need to add `public partial class Program { }` at the bottom of `Program.cs` so the test factory can reference it, OR reference the assembly directly.

### 2C. `LeaderboardControllerTests.cs`

**File:** `backend/QuizLoop.Tests/LeaderboardControllerTests.cs`

Test:

- `GET /api/leaderboard` returns 200 and empty list when no rounds exist
- `GET /api/leaderboard?period=daily` returns only today's rounds
- `GET /api/leaderboard?period=weekly` returns last 7 days
- `GET /api/leaderboard?period=invalid` returns 400
- `POST /api/leaderboard/submit` with valid body returns 200 and created round
- `POST /api/leaderboard/submit` without auth returns 401
- Leaderboard is sorted by total score descending, limited to top 50

### 2D. `UserSyncControllerTests.cs`

**File:** `backend/QuizLoop.Tests/UserSyncControllerTests.cs`

Test:

- `GET /api/user/profile` auto-creates a new profile for first-time user
- `GET /api/user/profile` returns existing profile for known user
- `POST /api/user/sync` merges correctly: takes `Math.Max` of `streakBest`, `totalGames`, `coins`
- `POST /api/user/sync` without auth returns 401
- `POST /api/user/sync` uses client's `streakCurrent` and `accuracyPct` directly

---

## Task 3: GitHub Actions CI Pipeline

### 3A. Create Frontend CI Workflow

**File:** `c:\Projects\QuizLoop\.github\workflows\frontend-ci.yml`

```yaml
name: Frontend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'quizloop-app/**'
  pull_request:
    branches: [main]
    paths:
      - 'quizloop-app/**'

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: quizloop-app

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: quizloop-app/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npx ng lint

      - name: Run tests
        run: npx ng test --watch=false --browsers=ChromeHeadless --code-coverage

      - name: Build
        run: npx ng build --configuration=production

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: quizloop-app/coverage/
```

### 3B. Create Backend CI Workflow

**File:** `c:\Projects\QuizLoop\.github\workflows\backend-ci.yml`

```yaml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Restore
        run: dotnet restore QuizLoop.Api/QuizLoop.Api.csproj

      - name: Build
        run: dotnet build QuizLoop.Api/QuizLoop.Api.csproj --no-restore

      - name: Restore Tests
        run: dotnet restore QuizLoop.Tests/QuizLoop.Tests.csproj

      - name: Run Tests
        run: dotnet test QuizLoop.Tests/QuizLoop.Tests.csproj --no-restore --verbosity normal
```

### 3C. Create Fastlane Scaffold

**File:** `c:\Projects\QuizLoop\quizloop-app\fastlane\Fastfile`

Create a basic scaffold with two lanes (no real signing — just the structure):

```ruby
default_platform(:android)

platform :android do
  desc "Build debug APK and deploy to internal testing"
  lane :internal do
    # TODO: Configure signing and Google Play credentials
    puts "Internal testing deploy lane — configure signing first"
  end

  desc "Build release and deploy to production"
  lane :production do
    # TODO: Configure signing, versioning, and Google Play credentials
    puts "Production deploy lane — configure signing first"
  end
end

platform :ios do
  desc "Build and deploy to TestFlight"
  lane :internal do
    # TODO: Configure signing and App Store Connect credentials
    puts "TestFlight deploy lane — configure signing first"
  end

  desc "Build and deploy to App Store"
  lane :production do
    # TODO: Configure signing, versioning, and App Store Connect credentials
    puts "App Store deploy lane — configure signing first"
  end
end
```

---

## Execution Order

1. **Task 1A** — Create `quiz-state.service.spec.ts` (scoring, streak, timer tests)
2. **Task 1B** — Create `user-profile.service.spec.ts`
3. **Task 1C** — Create `ad.service.spec.ts` (ad gating tests)
4. **Task 1D** — Create `consent.service.spec.ts`
5. **Task 1E** — Create `translation.service.spec.ts`
6. Run `npx ng test --watch=false --browsers=ChromeHeadless` — all tests must pass
7. **Task 2A** — Create backend test project
8. **Task 2B** — Create `TestWebApplicationFactory.cs`
9. **Task 2C** — Create `LeaderboardControllerTests.cs`
10. **Task 2D** — Create `UserSyncControllerTests.cs`
11. Add `public partial class Program { }` at the end of `backend/QuizLoop.Api/Program.cs`
12. Run `dotnet test backend/QuizLoop.Tests/QuizLoop.Tests.csproj` — all tests must pass
13. **Task 3A** — Create frontend CI workflow
14. **Task 3B** — Create backend CI workflow
15. **Task 3C** — Create Fastlane scaffold

---

## Verification

### Frontend Tests

```powershell
cd c:\Projects\QuizLoop\quizloop-app
npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: **All specs pass.** Minimum spec count: ~25 (5 for quiz-state scoring, 4 for streak, 2 for round completion, 2 for timer, 4 for user-profile, 5 for ad-service, 4 for consent-service, 4 for translation-service).

### Backend Tests

```powershell
cd c:\Projects\QuizLoop\backend
dotnet test QuizLoop.Tests\QuizLoop.Tests.csproj --verbosity normal
```

Expected: **All tests pass.** Minimum test count: ~12 (7 for leaderboard, 5 for user-sync).

### Build (no regressions)

```powershell
cd c:\Projects\QuizLoop\quizloop-app
npx ng build --configuration=development

cd c:\Projects\QuizLoop\backend
dotnet build QuizLoop.Api\QuizLoop.Api.csproj
```

Both must pass with zero errors.

> [!CAUTION]
>
> - Do NOT modify any existing source files (services, pages, templates) except to add `public partial class Program { }` to `Program.cs`.
> - Do NOT install Jest or switch test frameworks — use Karma + Jasmine that's already configured.
> - Do NOT modify `karma.conf.js` or `angular.json` test configuration unless strictly needed (e.g., headless Chrome).
> - Mock all Capacitor plugins — they don't run in a browser test environment.
