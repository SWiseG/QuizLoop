# Prompt: GitHub Actions CI — Frontend + Backend

You are setting up CI pipelines for the **QuizLoop** project. Create two GitHub Actions workflow files. Read the entire prompt before writing any file.

---

## Project Context

| Item | Value |
|---|---|
| **Repo root** | `c:\Projects\QuizLoop` |
| **Frontend** | `quizloop-app/` — Angular 20, Ionic 8, Node 22, Karma + Jasmine |
| **Backend** | `backend/` — .NET 10, ASP.NET Core 10, xUnit |
| **Solution** | `backend/QuizLoop.slnx` (references all 5 projects including Tests) |
| **Frontend test cmd** | `npx ng test --watch=false --browsers=ChromeHeadless` |
| **Backend test cmd** | `dotnet test --verbosity normal` |
| **Frontend build cmd** | `npx ng build --configuration=production` |
| **Frontend lint cmd** | `npx ng lint` |
| **Lock file** | `quizloop-app/package-lock.json` |

---

## Task 1: Frontend CI

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
  lint-test-build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: quizloop-app

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: quizloop-app/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npx ng lint

      - name: Unit tests
        run: npx ng test --watch=false --browsers=ChromeHeadless --code-coverage

      - name: Build (production)
        run: npx ng build --configuration=production

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: quizloop-app/coverage/
          retention-days: 14

      - name: Upload build output
        uses: actions/upload-artifact@v4
        with:
          name: frontend-www
          path: quizloop-app/www/
          retention-days: 7
```

---

## Task 2: Backend CI

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

      - name: Setup .NET 10
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Restore
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Run tests
        run: dotnet test --no-restore --verbosity normal
```

---

## Execution Order

1. Create directory `c:\Projects\QuizLoop\.github\workflows\`
2. Create `frontend-ci.yml` with the content above
3. Create `backend-ci.yml` with the content above
4. Verify both files have valid YAML syntax

---

## Verification

After creating the files, verify YAML validity:

```powershell
# Check files exist
Test-Path c:\Projects\QuizLoop\.github\workflows\frontend-ci.yml
Test-Path c:\Projects\QuizLoop\.github\workflows\backend-ci.yml
```

Both should return `True`.

> [!CAUTION]
>
> - Do NOT modify any source code, test files, or project files
> - Do NOT install additional packages
> - These files are ONLY for GitHub Actions — they won't be tested locally
