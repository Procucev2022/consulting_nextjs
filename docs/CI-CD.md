# CI/CD & Deployment Architecture — Procucev Consulting Portal

This document outlines the automated GitHub CI/CD pipeline, branch strategy, deployment architecture, and security policies for the **Procucev Consulting Portal** monorepo.

---

## 1. Hosting & Systems Architecture

The application monorepo isolates frontend, backend, and persistence tiers:

```text
┌──────────────────────────────────────────────┐
│        Procucev Consulting Portal           │
├──────────────────────┬───────────────────────┤
│ Tier                 │ Infrastructure Target │
├──────────────────────┼───────────────────────┤
│ Frontend (Next.js)   │ Cloudflare Pages      │
│ Backend (Express API)│ Dedicated Node Server │
│ Database (PostgreSQL)│ Dedicated Database    │
└──────────────────────┴───────────────────────┘
```

### Architectural Separation
1. **Frontend (`frontend/`)**:
   - Next.js application built in static export mode (`output: 'export'`) with unoptimized static images.
   - Deployed directly to **Cloudflare Pages** project `procucev-consulting-portal`.
   - Production URL: [https://procucev-consulting-portal.pages.dev/](https://procucev-consulting-portal.pages.dev/)
   - Expected build artifact: `frontend/out/`.
2. **Backend (`backend/`)**:
   - Independent Node.js / Express API service with Prisma ORM.
   - **Not deployed by Cloudflare Pages**. Hosted separately on dedicated backend infrastructure.
3. **Database (`docker-compose.yml`, PostgreSQL)**:
   - Dedicated PostgreSQL database.
   - **Zero automated modifications by CI/CD**. Production migrations and seeding are executed exclusively through controlled administrative operations.

---

## 2. Branch Promotion Strategy

We enforce a strict Git flow for production stability:

```text
Feature Branch (feature/*, fix/*)
           │
           ▼
     Pull Request
           │
           ▼
    GitHub Actions CI (Consulting CI)
           │
           ▼
        develop
           │
       [Testing]
           │
           ▼
     Pull Request
           │
       [Review]
           │
           ▼
         main
           │
           ▼
   Deploy Production Workflow
           │
           ▼
    Cloudflare Pages (https://procucev-consulting-portal.pages.dev/)
```

### Flow Rules:
- **`feature/*` / `fix/*`**: All ongoing development begins on feature branches branched off `develop`.
- **`develop`**: Integration branch for feature testing. Pull requests trigger `Consulting CI`.
- **`main`**: Production release branch. Merges to `main` trigger `deploy-production.yml`.

---

## 3. GitHub Actions Workflows

The repository maintains two focused, non-duplicative GitHub Actions workflows in `.github/workflows/`:

### A. CI Workflow (`.github/workflows/ci.yml`)
- **Name**: `Consulting CI`
- **Triggers**:
  - `pull_request` targeting `main` or `develop`
  - `push` to `main` or `develop`
  - `workflow_dispatch` (manual trigger)
- **Runner**: `ubuntu-latest`, Node.js 20
- **Validation Sequence**:
  1. `npm run install:all`: Installs root, frontend, and backend dependencies.
  2. `npm run lint`: Verifies ESLint compliance across frontend and backend.
  3. `npm run typecheck`: Strict TypeScript type compilation (`tsc --noEmit`) with 0 errors.
  4. `npm run build:frontend`: Verifies Next.js client production build.
  5. `npm run build:backend`: Compiles TypeScript backend server.
  6. `npm run check:budget`: Validates client bundle footprints against performance budgets.
  7. `npm run test:ci`: Runs automated unit test suites with coverage reporting.
  8. PR Summary Bot: Publishes an executive test and coverage summary comment on the PR.
- **Safety**: Does **not** run database migrations (`db:push`, `db:seed`, `db:setup`).

### B. Production Deployment Workflow (`.github/workflows/deploy-production.yml`)
- **Name**: `Deploy Production`
- **Triggers**:
  - `push` to `main` (merges or commits to production branch)
  - `workflow_dispatch` (authorized maintainer manual trigger)
- **Runner**: `ubuntu-latest`, Node.js 20
- **Pre-Deployment Gates**:
  - Validates Lint, Typecheck, Frontend Build, Backend Build, and Tests before deploying.
  - If any gate fails, deployment is aborted with exit code 1.
- **Deployment Execution**:
  - Verifies presence of required repository secrets (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`).
  - Executes `npm run deploy:cloudflare` (`node scripts/deploy-cloudflare.js`).
  - Uploads `frontend/out` to Cloudflare Pages project `procucev-consulting-portal` with branch `main`.
  - Executes mandatory **3-pillar post-deployment operations verification**:
    1. Backend Service Operation (Health Check `HTTP 200`)
    2. Database Store Operation (`TenantMaster` query)
    3. File Upload Operation (Dataset ingestion)
  - Publishes deployment summary and verification table to GitHub Step Summary.

---

## 4. Required GitHub Repository Secrets

Configure the following secrets under **Settings > Secrets and variables > Actions**:

| Secret Name | Description | Source |
| :--- | :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | Cloudflare Dashboard (Overview > Account ID) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token with Pages Edit permissions | [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) (`Edit Cloudflare Pages` template) |

> [!CAUTION]
> Never print, echo, or log secret values in workflow files, scripts, or commit history.

---

## 5. Recommended Branch Protection Rules for `main`

To ensure production integrity, repository administrators should configure branch protection on `main`:

1. Navigate to **Settings > Branches > Add branch protection rule**.
2. Set **Branch name pattern**: `main`.
3. Check **Require a pull request before merging**:
   - Require at least 1 approval.
   - Dismiss stale pull request approvals when new commits are pushed.
4. Check **Require status checks to pass before merging**:
   - Require branches to be up to date before merging.
   - Status checks required: `Consulting CI / Consulting CI Quality Gate`.
5. Check **Do not allow bypassing the above settings**.
6. Prevent force pushes and branch deletions.

---

## 6. Safe Database Management Policy

- **No Automated Production Migrations**: CI/CD workflows never automatically run `db:push`, `db:seed`, or `db:setup` against production.
- **Local / Staging Setup**:
  ```bash
  # Start local PostgreSQL container
  docker compose up -d

  # Push schema & seed local test data
  npm run db:setup
  ```
- **Production Migrations**: Executed through audited migration scripts with maintenance windows and explicit database backups.
