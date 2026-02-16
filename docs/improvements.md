# QuizLoop — Melhorias Sugeridas

Última revisão: 2026-02-16

---

## 🏗️ Arquitetura

### 1. Migrar de SQLite para PostgreSQL (Render PostgreSQL free tier)

SQLite no Docker é efêmero — toda vez que o container reinicia, os dados são perdidos. O Render oferece PostgreSQL free tier (256 MB). Basta trocar o provider EF Core:

- Adicionar `Npgsql.EntityFrameworkCore.PostgreSQL`
- Alterar `UseSqlite(...)` → `UseNpgsql(connectionString)`
- Setar a connection string via env var no Render

---

### 2. API de perguntas centralizada

Criar um `QuestionsController` no backend com perguntas persistidas no banco, ou integrar com API externa (ex: [Open Trivia Database](https://opentdb.com/api_config.php)). Permite adicionar categorias, dificuldades, e conteúdo em múltiplos idiomas.

---

### 3. Persistência local com Capacitor Preferences

Usar `@capacitor/preferences` para salvar o perfil do usuário, progresso, e configurações localmente no dispositivo. Isso garante que os dados sobrevivem ao fechamento do app, mesmo sem internet.

---

## 🔒 Segurança

### 4. Adicionar rate limiting nos endpoints

O `POST /api/leaderboard/submit` e `POST /api/user/sync` não têm rate limiting. Um usuário mal intencionado pode submeter scores infinitos. Adicionar middleware como `AspNetCoreRateLimit`.

---

### 5. Validação de score no backend

O endpoint `submit` aceita qualquer `Score` e `CorrectCount` no body sem validação. Um usuário pode enviar `score: 999999`. Adicionar limites (ex: max score = `100 + 15*10 = 250` por pergunta × 10 perguntas = 2500 max).

---

### 6. Não armazenar a API key do Firebase no código fonte

A `apiKey` do Firebase está em `environment.prod.ts`, que vai pro GitHub (mesmo sendo privado). Considerar:

- Usar variáveis de build do Capacitor
- Para o backend, já está correto via `render.yaml` env vars

---

## 🎮 Funcionalidade

### 7. Sistema de vidas (life system)

O `rewards.page.ts` tem um `TODO: grant life reward` mas não existe sistema de vidas. Implementar: 5 vidas, -1 por quiz, +1 ao assistir ad, regeneração por tempo (1 vida a cada 30min).

---

### 8. Push Notifications para Daily Challenge

`@capacitor-firebase/messaging` já está instalado (detectado no `cap sync`) mas não está configurado. Adicionar notificação diária lembrando o usuário do Daily Challenge.

---

### 9. Offline support com Service Worker

A `QuestionService` depende de dados estáticos no código. Mesmo assim, não há fallback se o eventual API call falhar. Adicionar caching de perguntas via `@angular/service-worker` ou IndexedDB.

---

### 10. Expand questionnaire bank with i18n

Atualmente as 10 perguntas estão em inglês. Para o mercado PT-BR, traduzir as perguntas usando as mesmas chaves i18n ou criar bancos separados por idioma.

---

## 💅 UX / UI

### 11. Feedback tátil (Haptics)

`@capacitor/haptics` está instalado mas não utilizado no código. Adicionar vibração em:

- Resposta correta: `Haptics.notification({ type: 'success' })`
- Resposta errada: `Haptics.notification({ type: 'error' })`
- Timeout: `Haptics.vibrate()`

---

### 12. Loading states e skeleton screens

Não há indicadores de carregamento nas páginas. Quando a API estiver ativa, o leaderboard e perfil devem mostrar skeletons (`ion-skeleton-text`) enquanto carregam.

---

### 13. Error handling visual

Os `.catch` em todos os serviços logam no console mas não mostram feedback ao usuário. Adicionar `IonToast` ou `IonAlert` para erros de rede, falha de autenticação, etc.

---

### 14. Dark/Light mode toggle

O app usa dark theme por padrão. Considerar adicionar toggle na Settings para light mode, usando `prefers-color-scheme` como default.

---

## ⚡ Performance

### 15. Lazy load do TranslateHttpLoader

O `main.ts` usa `PreloadAllModules` para routes — ok. Mas o `TranslateHttpLoader` carrega o JSON de idioma de forma síncrona no bootstrap. Considerar carregar sob demanda.

---

### 16. Dockerfile: `.dockerignore` ausente

Não há `.dockerignore`. O `COPY backend/ .` copia `bin/`, `obj/`, e a pasta `QuizLoop.Tests/` (1051 files) desnecessariamente para o build, aumentando o tempo de build e o tamanho da imagem.

**Sugestão:** Criar `.dockerignore`:

```
backend/**/bin/
backend/**/obj/
backend/QuizLoop.Tests/
```
