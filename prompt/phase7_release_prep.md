# Prompt: Phase 7 — Release Prep (App Icon, ASO, Security, Legal)

You are preparing the **QuizLoop** app for soft launch. Your job is to generate the app icon assets, create ASO metadata, run a security audit, and create privacy/terms pages. Read the entire prompt before writing any code.

---

## Project Context

| Item | Value |
|---|---|
| **Frontend** | `c:\Projects\QuizLoop\quizloop-app` — Angular 20, Ionic 8, Capacitor 8.1 |
| **App ID** | `com.quizloop.app` |
| **App Name** | QuizLoop |
| **Logo source** | `c:\Projects\QuizLoop\docs\logo.jpg` |
| **Supported locales** | `en-US`, `pt-BR` |
| **Current env file** | `src/environments/environment.ts` (has placeholder Firebase keys + test AdMob IDs) |
| **Settings page** | Already has "Privacy Policy" and "Terms of Service" links (not yet wired) |

---

## Task 1: App Icon Generation

### 1A. Generate icon assets

Using the logo from `docs/logo.jpg`, create properly sized app icons for both platforms.

Create a folder `quizloop-app/resources/` and place:

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024×1024 px | Master icon (App Store / Play Store) |
| `icon-foreground.png` | 1024×1024 px | Android adaptive icon foreground layer |
| `splash.png` | 2732×2732 px | Splash screen image (centered logo, solid background `#1A1A2E`) |

### 1B. Create `resources/icon-background.png`

A solid color image `1024×1024` with the app's primary dark background color `#1A1A2E`.

### 1C. Update `capacitor.config.ts`

Add splash screen config:

```typescript
SplashScreen: {
  launchAutoHide: true,
  launchShowDuration: 1500,
  backgroundColor: '#1A1A2E',
  showSpinner: false,
},
```

> [!IMPORTANT]
> Do NOT run `npx cap add android` or `npx cap add ios` — the user will do this separately when Firebase is configured.

---

## Task 2: ASO Metadata

Create the following file with store listing metadata in both languages:

**File:** `c:\Projects\QuizLoop\docs\aso-metadata.md`

### English (en-US)

| Field | Content |
|-------|---------|
| **App Name** | QuizLoop – Daily Brain Quiz |
| **Short Description** (80 chars max) | Challenge yourself daily. Build streaks. Climb the leaderboard. |
| **Full Description** (4000 chars max) | See below |
| **Keywords** (100 chars max, comma-separated) | quiz,trivia,brain,daily challenge,streak,leaderboard,education,knowledge,fun,learning |
| **Category** | Education / Trivia |

**Full Description (English):**

```
🧠 Train your brain daily with QuizLoop!

QuizLoop is your daily quiz companion that helps you learn something new every day while having fun. Start a round, answer 10 questions against the clock, and build your streak to climb the global leaderboard.

✨ KEY FEATURES:

🔥 Daily Challenge — A new set of questions every day. Come back daily to keep your streak alive!

🎯 Multiple Game Modes — Choose from Daily, Classic, or Category-based quizzes to test your knowledge.

🏆 Global Leaderboards — Compete with players worldwide. Check daily and weekly rankings.

⏱️ Speed Bonus — Answer faster to earn more points. Every second counts!

💡 Helpful Hints — Stuck on a tough question? Use hints to narrow down your options.

🎁 Reward Center — Watch a short video to earn bonus coins, extra lives, or unlock explanations.

📊 Track Your Progress — View your stats, accuracy, and personal best streaks on your profile.

🌍 Available in English and Portuguese — More languages coming soon!

🔒 Privacy First — We respect your data. No account required to play. Optional sign-in to sync progress across devices.

Download QuizLoop now and start your streak today!
```

### Portuguese (pt-BR)

| Field | Content |
|-------|---------|
| **App Name** | QuizLoop – Quiz Diário |
| **Short Description** | Desafie-se diariamente. Construa sequências. Suba no ranking. |
| **Full Description** | See below |
| **Keywords** | quiz,conhecimento,perguntas,desafio diário,ranking,educação,aprendizado,diversão,cérebro,trivia |
| **Category** | Educação / Trivia |

**Full Description (Portuguese):**

```
🧠 Treine seu cérebro diariamente com o QuizLoop!

O QuizLoop é seu companheiro diário de quiz que ajuda você a aprender algo novo todos os dias se divertindo. Comece uma rodada, responda 10 perguntas contra o relógio e construa sua sequência para subir no ranking global.

✨ PRINCIPAIS RECURSOS:

🔥 Desafio Diário — Um novo conjunto de perguntas todos os dias. Volte diariamente para manter sua sequência!

🎯 Múltiplos Modos de Jogo — Escolha entre Diário, Clássico ou quizzes por Categoria.

🏆 Rankings Globais — Compete com jogadores do mundo todo. Confira os rankings diários e semanais.

⏱️ Bônus de Velocidade — Responda mais rápido para ganhar mais pontos!

💡 Dicas Úteis — Travou em uma pergunta difícil? Use dicas para eliminar opções.

🎁 Centro de Recompensas — Assista um vídeo curto para ganhar moedas bônus, vidas extras ou desbloquear explicações.

📊 Acompanhe Seu Progresso — Veja suas estatísticas, precisão e melhores sequências no seu perfil.

🌍 Disponível em Inglês e Português!

🔒 Privacidade em Primeiro Lugar — Respeitamos seus dados. Não é necessário criar conta para jogar.

Baixe o QuizLoop agora e comece sua sequência hoje!
```

---

## Task 3: Security Audit

Scan the entire codebase and verify the following. Create a report file:

**File:** `c:\Projects\QuizLoop\docs\security-audit.md`

### 3A. Check for hardcoded secrets

Search for any hardcoded API keys, tokens, or secrets in the codebase. The following are **expected and acceptable**:

| File | Expected placeholder |
|------|---------------------|
| `environment.ts` | `PLACEHOLDER_DEV_API_KEY` — dev only, must be replaced before production |
| `environment.ts` | AdMob test IDs (`ca-app-pub-3940256099942544/*`) — Google's official test IDs |
| `environment.prod.ts` | Should have empty/placeholder values |
| `appsettings.json` | `quizloop-dev` as Firebase project ID |

Flag anything outside this list as a **finding**.

### 3B. Check for debug artifacts

Search for:

- `console.log` statements that leak sensitive data (user tokens, passwords)
- `debugger;` statements (should be zero — user just removed them)
- `TODO` and `FIXME` comments (list them but they are informational, not security issues)

### 3C. Check ad policy compliance

Verify in the code:

- ✅ No interstitial ads during quiz (only on results page)
- ✅ Rewarded ads are always optional (user clicks to watch)
- ✅ Ad caps exist (max 2 interstitials/session, 90s cooldown)
- ✅ Kill switch exists (`adsEnabled` signal)

### 3D. Check CORS policy

Verify in `Program.cs`:

- The current `AllowAnyOrigin()` CORS policy is dev-only and must be tightened for production

### 3E. Create the report

Format the security audit as a markdown file with sections: Passed ✅, Warnings ⚠️, Action Required 🔴.

---

## Task 4: Privacy Policy & Terms of Service

### 4A. Create Privacy Policy page

**File:** `c:\Projects\QuizLoop\quizloop-app\src\app\features\settings\privacy-policy\privacy-policy.page.ts`
**File:** `c:\Projects\QuizLoop\quizloop-app\src\app\features\settings\privacy-policy\privacy-policy.page.html`
**File:** `c:\Projects\QuizLoop\quizloop-app\src\app\features\settings\privacy-policy\privacy-policy.page.scss`

Create a standalone Angular page with Ionic components that displays a privacy policy. Use `ion-content`, `ion-header`, `ion-back-button`. Import `TranslateModule` and use i18n keys.

**Add route:** In the app routes, add:

```typescript
{ path: 'privacy-policy', loadComponent: () => import('./features/settings/privacy-policy/privacy-policy.page').then(m => m.PrivacyPolicyPage) }
```

**Privacy policy must cover:**

- What data is collected (analytics events, quiz scores, profile data)
- How data is stored (locally on device + optional cloud sync via Firebase)
- Third-party SDKs (Firebase Analytics, AdMob, Firebase Auth)
- User rights (data deletion, export)
- Contact information (placeholder email: `privacy@quizloop.app`)
- GDPR compliance (consent before personalized ads)
- COPPA note (app is not directed at children under 13)
- Last updated date

### 4B. Create Terms of Service page

**File:** `c:\Projects\QuizLoop\quizloop-app\src\app\features\settings\terms\terms.page.ts`
**File:** `c:\Projects\QuizLoop\quizloop-app\src\app\features\settings\terms\terms.page.html`
**File:** `c:\Projects\QuizLoop\quizloop-app\src\app\features\settings\terms\terms.page.scss`

Same structure as privacy policy. Must cover:

- Acceptance of terms
- Description of the service
- User accounts (optional anonymous + Google sign-in)
- In-app purchases (non-refundable, premium removes ads)
- Prohibited conduct
- Disclaimer of warranties
- Limitation of liability
- Changes to terms
- Contact info (placeholder: `legal@quizloop.app`)

### 4C. Wire links in Settings page

Modify `settings.page.ts` to add navigation methods:

```typescript
goToPrivacy() {
  this.router.navigateByUrl('/privacy-policy');
}

goToTerms() {
  this.router.navigateByUrl('/terms');
}

requestDataDeletion() {
  // TODO: Implement data deletion trigger (Firebase function or support email)
  window.open('mailto:privacy@quizloop.app?subject=Data Deletion Request');
}
```

Modify `settings.page.html` to wire the `(click)` events on the Privacy Policy, Terms, and Delete Data cards.

### 4D. Add i18n keys

Add the necessary translation keys in both `en-US.json` and `pt-BR.json` for the privacy policy and terms page content. Use keys like:

```
PRIVACY.TITLE, PRIVACY.INTRO, PRIVACY.DATA_COLLECTED, PRIVACY.DATA_STORAGE, ...
TERMS.TITLE, TERMS.INTRO, TERMS.ACCEPTANCE, TERMS.SERVICE_DESCRIPTION, ...
```

---

## Execution Order

1. **Task 1A-C** — Create resources folder with icon/splash assets and update capacitor config
2. **Task 2** — Create `aso-metadata.md`
3. **Task 3** — Run security audit, create `security-audit.md`
4. **Task 4A** — Create Privacy Policy page + route
5. **Task 4B** — Create Terms of Service page + route
6. **Task 4C** — Wire Settings page links
7. **Task 4D** — Add i18n keys
8. Run `npx ng build --configuration=development` — must pass with zero errors

---

## Verification

```powershell
cd c:\Projects\QuizLoop\quizloop-app
npx ng build --configuration=development
```

Must pass with zero errors.

Manual check:

- Navigate to Settings → Privacy Policy → verify page renders with translated content
- Navigate to Settings → Terms → verify page renders
- Click "Delete Data" → verify opens mailto link
- Check `resources/` folder has `icon.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`

> [!CAUTION]
>
> - Do NOT run `npx cap add android/ios` — user will do this after configuring Firebase
> - Do NOT replace the placeholder Firebase keys — user will configure these
> - Do NOT modify any existing service files
> - The Settings page (`settings.page.ts`) needs `Router` injected — add it if not already present
> - Remember to import `TranslateModule` in both new page components
