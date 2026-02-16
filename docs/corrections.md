# QuizLoop — Correções (Bugs & Inconsistências)

Última revisão: 2026-02-16

## 🟡 Menor

### 10. `useHint()` no QuizPage é um no-op

**Arquivo:** [quiz.page.ts](file:///c:/Projects/QuizLoop/quizloop-app/src/app/features/quiz/quiz.page.ts#L27-L29)

O método `useHint()` só faz `console.log('Hint requested')`. Se houver um botão de hint no HTML, ele não faz nada.

---

### 11. Inline styles na leaderboard HTML

**Arquivo:** [leaderboard.page.html](file:///c:/Projects/QuizLoop/quizloop-app/src/app/features/leaderboard/leaderboard.page.html#L25-L56)

Múltiplos `style="..."` inline em vez de classes CSS. Viola o padrão do restante do projeto que usa `.scss`.

---

### 12. `app_version` fixo como `'1.0.0'` no AnalyticsService

**Arquivo:** [analytics.service.ts](file:///c:/Projects/QuizLoop/quizloop-app/src/app/core/services/analytics.service.ts#L29)

A versão está hardcoded. Deveria ser lida de `package.json` ou de uma constante de build.

---

### 13. Accuracy calculation usa aproximação frágil

**Arquivo:** [user-profile.service.ts](file:///c:/Projects/QuizLoop/quizloop-app/src/app/core/services/user-profile.service.ts#L47)

O cálculo `oldTotalCorrect = Math.round((profile.accuracyPct / 100) * profile.totalGames * 10)` assume "~10 perguntas por jogo historicamente" — isso introduz erro acumulativo progressivo.

**Correção:** Rastrear `totalCorrect` e `totalAnswered` como campos separados em vez de derivar de `accuracyPct`.
