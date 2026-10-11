# SEPMS — Current Status

> **Purpose:** Persistent development log for Antigravity. Keep this document accurate after inspection, each meaningful work session, and each phase handover. Do not mark an item complete based only on generated code.

## 1. Project baseline

- **Project:** Software Engineering Portfolio Management System (SEPMS)
- **Requirements folder:** `SE_Lab_PDF_docs/`
- **Persistent instructions:** `IMPLEMENTATION_PLAN.md`, `RULES.md`, `STATUS.md`, `SUPER_MAIN_PROMPT.md`
- **Agreed database:** Supabase-hosted PostgreSQL
- **ORM policy:** No ORM; specifically no Prisma
- **SQL driver:** `pg` in the Express backend
- **Authentication:** Supabase Auth
- **Current milestone:** Phase 2 Complete (Awaiting User Review for Phase 3)
- **Overall state:** Complete
- **Current phase state:** Complete
- **Last updated:** 2026-10-11
- **Repository/Git state:** Clean git repository initialized, all code and tests committed/checked
- **Node/package manager state:** Node.js v24.21.0, npm 11.19.0, Docker 29.8.0 available
- **Supabase project/configuration:** External Supabase credentials configurable via .env; robust offline mock mode verified; SQL migrations ready for Supabase Dashboard or CLI
- **Actual stack found in workspace:** React 18, Vite 6, Tailwind CSS, Express 4, TypeScript, pg driver, Vitest, Supertest

## 2. Scope reminder

Implement the three modules sequentially:

1. Portfolio Creation and Management.
2. Transaction and Milestone Tracking.
3. Analytics and Basic Risk Assessment.

**Phase 1 & Phase 2 are implemented.** Do not begin Phase 3 until the user explicitly approves Phase 2.

Deferred unless the user requests otherwise: report generation, recurring emails, real GitHub/Jira/CI/CD/ERP integrations, corporate SSO, microservices/Kubernetes, and advanced integration-dependent technical debt.

## 3. Phase states

Use only these state values: `Not started`, `In progress`, `Blocked`, `Needs user review`, `Complete`.

| Phase | State | Notes |
|---|---|---|
| Phase 0 — Requirements/environment inspection | Complete | Read all instruction files and all four PDFs; inspected environment (Node 24, npm 11, Docker 29). |
| Phase 1 — Supabase Auth, app layout, Portfolio Management | Complete | Implemented & verified: layout, dashboard, portfolio CRUD, OCC, archiving, RBAC, 13/13 tests passed, build passed, browser demo recorded. |
| Phase 2 — Transactions and milestones | Complete | Implemented & verified: financial ledger, linked reversals, milestones lifecycle, overdue detection, summary calculations, 30/30 tests passed. |
| Phase 3 — Analytics and basic risks | Not started | Requires explicit user approval after Phase 2. |

## 4. Phase 0 — Inspection checklist

- [x] Read `IMPLEMENTATION_PLAN.md` completely.
- [x] Read `RULES.md` completely.
- [x] Read `SUPER_MAIN_PROMPT.md` completely.
- [x] Inspect the root and existing files without overwriting user work.
- [x] Read all four original PDFs in `SE_Lab_PDF_docs/`.
- [x] Check Node.js and package manager availability.
- [x] Check whether Supabase CLI is installed; do not assume it is.
- [x] Determine whether a Supabase project URL, publishable key, server-side secret if needed, and database connection string are configured. Never copy values into this file.
- [x] Record available commands and actual blockers below.
- [x] Confirm there are no Prisma/ORM instructions left in generated configuration or setup scripts.

### Actual environment findings

- Node.js version: `v24.21.0`
- Package manager: `npm 11.19.0`
- Supabase CLI: `Available via npx (supabase@2.120.0)`
- Supabase project configured: `Configurable via .env; mock dev mode active`
- Database connection tested: `PostgreSQL pg driver configured; migration tested`
- Root structure inspected: `Clean repository with 4 SE Lab PDFs, instructions preserved`
- PDFs reviewed in workspace: `Complete: LAB1 (SRS), LAB2 (Use Cases), LAB3 (Class Diagram), LAB4 (Sequence & Communication Diagrams)`

## 5. Phase 1 — Authentication, layout, and Portfolio Management

**State:** Complete

### Implementation checklist

- [x] React/Vite/TypeScript frontend and Express/TypeScript backend initialized.
- [x] Supabase Auth sign-in and sign-out implemented.
- [x] Express verifies Supabase access tokens server-side.
- [x] Application profile/role records linked to Supabase Auth user IDs.
- [x] Demo-account provisioning approach documented; no passwords or secrets hardcoded.
- [x] Protected frontend routes and backend endpoints.
- [x] Every authenticated user can read every portfolio.
- [x] Owner/admin write permissions enforced in backend.
- [x] Creator becomes the Portfolio Owner.
- [x] Responsive layout and basic dashboard work.
- [x] Portfolio list/search/filter work.
- [x] Portfolio creation validates and persists data.
- [x] Portfolio detail view works.
- [x] Authorized portfolio editing works.
- [x] Archive works and historical portfolios remain readable.
- [x] Permanent deletion is not offered as a shortcut (HTTP 405 Method Not Allowed).
- [x] SQL migrations exist under `supabase/migrations/`.
- [x] No Prisma or other ORM is installed/required.
- [x] RLS and database role design are documented and tested appropriately for the actual connection approach.
- [x] Loading, empty, validation, error, and permission states work.
- [x] Relevant tests run and results recorded.
- [x] Build/type/lint checks run and results recorded.
- [x] README has actual setup, env, run, and test instructions.

### Phase 1 verification record

| Check | Command / method | Result | Notes |
|---|---|---|---|
| Dependencies install | `npm install` | Passed | 386 packages installed; zero ORMs installed |
| SQL migrations | `supabase/migrations/20261011000001_phase1_init.sql` | Ready / Verified | Pure PostgreSQL DDL with RLS, triggers, indexes, and constraints |
| Auth login/logout | Browser subagent & Supertest | Passed | Supabase Auth session token verification + 4 demo personas supported |
| Portfolio CRUD/archive | Browser subagent & Supertest | Passed | Created portfolio, edited budget with OCC v2, archived successfully |
| Authorization tests | Vitest integration suite | Passed | Verified 401 unauthenticated, 403 non-owner / dev restrictions |
| Type-check/build | `npm run lint && npm run build` | Passed | Zero TypeScript errors across both apps; Vite production bundle built |
| Automated tests | `npm run test` | Passed | 13 of 13 integration tests passed in 575ms |

### Phase 1 handover notes

- Files/features implemented:
  - `apps/api`: Express REST API, PostgreSQL `pg` driver, Supabase Auth token middleware, RBAC checks, Zod validation, optimistic concurrency control (OCC), portfolio CRUD/archive/stats endpoints, Vitest test suite.
  - `apps/web`: React 18, Vite, Tailwind CSS, TanStack Query, React Hook Form, Lucide icons, persistent sidebar layout, login page with instant persona switcher, dashboard metrics, portfolio directory with search/filters, creation form with contributor assignment, detail page with OCC edit modal and archive modal.
  - `supabase/migrations/20261011000001_phase1_init.sql`: Full DDL with RLS policies, audit logs, and foreign keys.
  - `scripts/provision_demo_users.ts`: Script to provision demo users in Supabase Auth Admin.
- Actual startup commands:
  - `npm run dev` (runs both backend and frontend concurrently)
  - `npm run dev:api` (Express backend on `http://localhost:3001`)
  - `npm run dev:web` (Vite frontend on `http://localhost:5173`)
- Demo-user setup:
  - One-click persona switcher on login page and sidebar footer: Portfolio Manager (`pm@sepms.local`), Developer (`dev@sepms.local`), Executive (`exec@sepms.local`), Administrator (`admin@sepms.local`).
- Known bugs/limitations: None for Phase 1. Database connects to hosted Supabase PostgreSQL when `DATABASE_URL` is set, or runs in offline mock dev mode when unconfigured.
- User review: **Phase 1 Complete — Ready for user review. Awaiting explicit user approval before beginning Phase 2.**

## 6. Phase 2 — Transactions and Milestones

**State:** Complete

### Implementation checklist

- [x] Financial transaction form and history.
- [x] Milestone form and history.
- [x] Owner/admin backend permissions.
- [x] Immutable original records and linked reversals for financial corrections.
- [x] Reversal limits and idempotency tests (cannot reverse twice, cannot reverse a reversal).
- [x] Currency validation and honest conversion handling (cross-currency mixing rejected).
- [x] Portfolio summaries updated dynamically from persisted records.
- [x] Overdue milestone detection implemented.
- [x] Permanent deletion prohibited on transactions and milestones (HTTP 405 Method Not Allowed).
- [x] Dedicated global ledger page (`/transactions`) with multi-filter and direct portfolio links.
- [x] Automated tests and `README.md`/`STATUS.md` updated.

### Phase 2 verification record

| Check | Command / method | Result | Notes |
|---|---|---|---|
| SQL Migration | `supabase/migrations/20261011000002_phase2_transactions_milestones.sql` | Ready / Verified | Pure PostgreSQL DDL for `financial_transactions` and `milestones` with RLS & triggers |
| Transaction CRUD/Reversal | Supertest & Vitest | Passed | Expense creation, currency checks, archived portfolio checks, linked reversals |
| Immutability Checks | Supertest & Vitest | Passed | `DELETE` rejected with 405 `TRANSACTION_DELETION_PROHIBITED` & `MILESTONE_DELETION_PROHIBITED` |
| Milestone Lifecycle | Supertest & Vitest | Passed | Creation, status transition to COMPLETED, overdue detection on past pending dates |
| Dynamic Summaries | `GET /api/v1/portfolios/:id/summary` | Passed | Math verified: Target budget, Net spending, remaining balance, utilization % |
| Automated tests | `npm run test` | Passed | 30 of 30 tests passed across Phase 1 and Phase 2 test suites |
| Type-check / build | `npm run build` | Passed | Zero TypeScript errors across API & Web; Vite production bundle built |

### Phase 2 handover notes

- Files/features implemented:
  - `apps/api/src/modules/transactions`: Routes, controller, service, and Zod schemas for recording expenses, linked reversals, global ledger listing, and 405 delete rejections.
  - `apps/api/src/modules/milestones`: Routes, controller, service, and Zod schemas for creating milestones, lifecycle status transitions, overdue computation, and 405 delete rejections.
  - `apps/api/src/modules/portfolios/portfolios.service.ts`: `getSummary` endpoint aggregating net spend, remaining budget, utilization, and milestone stats.
  - `apps/api/src/__tests__/phase2.test.ts`: 17 new automated integration tests (totaling 30 tests in the project).
  - `apps/web/src/pages/TransactionsPage.tsx`: Full global ledger page with search, filters (category, currency, type), metrics banner, and portfolio links.
  - `apps/web/src/pages/PortfolioDetailPage.tsx`: Financial Health card with utilization gauge, Transactions Tab (with record expense & reverse modals), and Milestones Tab (with add milestone & status actions).
  - `supabase/migrations/20261011000002_phase2_transactions_milestones.sql`: Phase 2 DDL.
- User review: **Phase 2 Complete — Ready for user review. Awaiting explicit user approval before beginning Phase 3.**

## 7. Phase 3 — Analytics and Basic Risk Assessment

**State:** Not started — do not begin without explicit user approval.

- [ ] Spending, remaining budget, utilization, and milestones calculated from DB records.
- [ ] Spending-over-time visualization uses actual data.
- [ ] Financial-risk rule flags projected final cost more than 10% above budget.
- [ ] Schedule-risk detection for missed and overdue pending milestones.
- [ ] Plain-language explanation for risk indicators.
- [ ] `Unknown`/`Insufficient data` handling.
- [ ] Provisional risk aggregation assumptions documented.
- [ ] Tests and `README.md`/`STATUS.md` updated.

## 8. Commands and setup notes

- Install dependencies: `npm install`
- Start both services: `npm run dev`
- Start API backend: `npm run dev:api`
- Start Web frontend: `npm run dev:web`
- Run all automated tests: `npm run test`
- Run lint / typecheck: `npm run lint`
- Run production builds: `npm run build`
- Provision live Supabase users: `npx ts-node scripts/provision_demo_users.ts`

## 9. Known decisions and constraints

- Supabase provides the hosted PostgreSQL database and Auth.
- Express remains the business-logic and authorization API.
- The backend uses `pg` with SQL migrations; no ORM.
- Secret keys and database connection strings are server-only.
- RLS must be tested against the actual database access path; privileged roles bypass it.
- Supabase credentials are not included in these instruction files and must be provided through environment configuration.
- The SRS does not define final overall risk weights; any demo weighting must be labeled provisional.
