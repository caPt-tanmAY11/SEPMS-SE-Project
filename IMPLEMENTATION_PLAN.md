# SEPMS — Implementation Plan

> Persistent project plan for Antigravity. Read this file together with `RULES.md`, `STATUS.md`, and `SUPER_MAIN_PROMPT.md` before making project changes. The user must explicitly approve each phase transition.

## 1. Project purpose

**Software Engineering Portfolio Management System (SEPMS)** is a web application for organizing software engineering projects and understanding their financial and delivery health. A portfolio groups a project or initiative with its budget, team members, milestones, and related engineering assets.

This is **not** a stock-market, mutual-fund, cryptocurrency, or personal-investment tracker. Financial records represent project budgets, expenses, allocations, and accounting adjustments.

The project requirements come from the four supplied SE lab PDFs in `SE_Lab_PDF_docs/`, covering the SRS, use cases, class model, and sequence/communication diagrams. Read those documents before significant implementation decisions. They remain the source material; this plan narrows the current deliverable to a demo-sized MVP.

## 2. Current MVP scope

Build exactly these three core modules, in order:

1. **Portfolio Creation and Management**
2. **Transaction and Milestone Tracking**
3. **Analytics and Basic Risk Assessment**

The modules must work together. Data entered in one module must persist in Supabase PostgreSQL and be reflected correctly in the other modules. Do not create static screens, fake success messages, or hardcoded charts presented as live information.

### Explicitly deferred

Do not implement these unless the user later requests them:

- PDF/CSV report generation and scheduled report delivery.
- Email delivery and automated executive summaries.
- Real GitHub, GitLab, Jira, Azure DevOps, Jenkins, or ERP integrations.
- Corporate OAuth/SAML single sign-on.
- Microservices, Kubernetes, or production-scale deployment infrastructure.
- Advanced technical-debt scoring that requires unavailable integration data.
- Any fourth core module outside the three agreed modules.

Future navigation items may be labeled `Planned` or `Coming later`; they must not pretend to work.

## 3. Agreed technology stack

Use this stack for a new implementation. If an existing repository appears later, inspect it before changing it and preserve useful working code unless it conflicts with an explicit requirement.

### Frontend

- React + TypeScript + Vite.
- Tailwind CSS and shadcn/ui (or a similarly accessible component system).
- React Router.
- TanStack Query for server state and API requests.
- React Hook Form + Zod for forms and client-side validation.
- Recharts, introduced in Phase 3.
- Lucide React for icons.
- `@supabase/supabase-js` for Supabase Auth sign-in, sign-out, and session handling.

### Backend

- Node.js + Express + TypeScript.
- REST API with consistent JSON responses and centralized error handling.
- Validate request payloads with Zod or an equivalent validation library.
- Use Supabase Auth to authenticate users.
- Use the `pg` Node.js driver for SQL queries against Supabase-hosted PostgreSQL. Use parameterized SQL; do not concatenate untrusted input into SQL.
- Verify Supabase access tokens on the server. Do not trust client-supplied user IDs, role names, or claims without verification.

### Database and migrations

- Supabase-hosted PostgreSQL.
- **No Prisma ORM. No Drizzle ORM. No other ORM or query-builder abstraction unless the user approves a change.**
- Store schema changes as versioned SQL migrations under `supabase/migrations/`.
- Use Supabase CLI where available. Provide a clearly documented Supabase Dashboard SQL Editor fallback for applying migrations if the CLI/local Docker setup is unavailable.
- Keep a SQL seed script for safe, non-sensitive demo data. Provision Auth users with a separate server-side script or documented Dashboard steps; do not attempt to insert Auth users directly into protected Supabase internal tables.

### Testing and tools

- Vitest or Jest for unit tests.
- Supertest or an equivalent library for Express API tests.
- ESLint and TypeScript checks.
- Docker may be used for ancillary local services, but the primary database is Supabase unless the user explicitly changes this decision.

## 4. Required project structure

Create and maintain a structure close to this. Reasonable improvements are allowed, but do not scatter business logic across UI components.

```text
project-root/
├── IMPLEMENTATION_PLAN.md
├── RULES.md
├── STATUS.md
├── SUPER_MAIN_PROMPT.md
├── SE_Lab_PDF_docs/
│   └── (four original reference PDFs; do not modify)
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       ├── features/
│   │       ├── layouts/
│   │       ├── lib/
│   │       ├── pages/
│   │       └── routes/
│   └── api/
│       └── src/
│           ├── config/
│           ├── middleware/
│           ├── modules/
│           ├── services/
│           ├── db/
│           ├── utils/
│           └── app.ts
├── supabase/
│   ├── config.toml            # if using Supabase CLI
│   ├── migrations/            # versioned .sql migrations
│   └── seed.sql               # non-sensitive database seed data only
├── scripts/                   # safe Auth-user provisioning / maintenance scripts
├── .env.example
├── .gitignore
├── package.json               # workspace scripts, if using a monorepo
└── README.md
```

Do not move or rename the supplied PDF directory. Do not overwrite the instruction files when scaffolding the project.

## 5. Supabase architecture and environment

### Authentication flow

1. The frontend signs users in with Supabase Auth using the public publishable key (legacy anon key is acceptable for an existing project).
2. The frontend sends the current Supabase access token as a Bearer token to the Express API.
3. The Express API verifies the token and retrieves the authoritative authenticated user before serving protected requests. Use a supported Supabase Auth verification method; do not trust `getSession()` client-side data as proof of server identity.
4. The API loads the application's role and portfolio ownership from trusted database records.
5. All business mutations pass server-side authorization checks.

Supabase Auth authenticates the user; the application's profile/role data determines SEPMS permissions. Never let a user choose or self-update their privileged role.

### Database connection

- Connect from Express using a server-only `DATABASE_URL` copied from the Supabase Dashboard's Connect panel.
- Choose a connection method compatible with the runtime/network: direct connection or session pooler for a persistent backend; use the pooler mode appropriate to the host if needed.
- Require encrypted connections and configure the driver/pool appropriately.
- The database connection string must never be sent to the frontend.
- Prefer a least-privilege application database role. Understand whether the connected role bypasses Row Level Security. Do not claim RLS protects a query executed using a privileged/bypass role.
- Enable RLS on exposed tables and create policies where appropriate. If the Express app accesses PostgreSQL through a role that bypasses RLS, backend authorization is still mandatory and RLS must not be represented as protecting those privileged server queries. A secure implementation may use a restricted runtime role and transaction-scoped verified user context so RLS can also apply; document the actual design and test it.
- Never put a Supabase secret/service-role key in any `VITE_` frontend variable. Secret keys bypass RLS and must remain server-side.

### Environment variables

Generate `.env.example` with placeholders only. Depending on the key format available in the Supabase project, support current publishable/secret keys or existing legacy anon/service-role keys.

Expected names should be clear and consistent, for example:

```dotenv
# Frontend (public values only)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=http://localhost:3001/api/v1

# Express API (server only)
PORT=3001
NODE_ENV=development
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
DATABASE_URL=
CORS_ORIGIN=http://localhost:5173

# Used only by explicit Auth provisioning/admin scripts, if implemented
# Never expose to browser code or commit actual values.
```

If an existing Supabase project only supplies legacy `anon` and `service_role` keys, document the equivalent variable mapping rather than inventing keys. `SUPABASE_SECRET_KEY` is for trusted administrative scripts only when needed; ordinary requests should use the caller's verified identity and normal API authorization.

If the required project URL/keys/database password are not available, implement configuration handling and `.env.example`, then report the exact missing setup steps. Do not fabricate credentials or claim live database tests passed.

## 6. User types and access model

Support four user classes:

- **Portfolio Manager:** can create portfolios and manage portfolios they own; can record expenses and milestones only where authorized.
- **Developer / Engineer:** can inspect every portfolio and its records; read-only by default.
- **Executive Leadership:** can inspect all portfolios, project status, analytics, and risks; read-only by default.
- **System Administrator:** can perform authorized administrative operations and manage system-level settings.

Mandatory rules:

- Anonymous users cannot access protected application data.
- Every authenticated user can read every portfolio and its relevant information. No private portfolios or department-based read restrictions.
- A permitted creator becomes the Portfolio Owner at creation time.
- Only the explicitly assigned Portfolio Owner or a System Administrator may perform portfolio mutations.
- The same owner/admin principle applies to transactions and milestones in Phase 2.
- Ordinary membership and persona labels do not grant owner-level write access.
- The backend enforces every permission check. Frontend hiding/disabled states are usability only.
- Return HTTP `401` for an unauthenticated request and `403` for an authenticated user without permission.

For a demo, support seeded/created Supabase Auth accounts for these personas. Auth users must be provisioned through supported Supabase Auth admin functions or the Dashboard, never by inserting rows directly into internal Auth tables. Development shortcuts must not be enabled in production.

## 7. Phase 0 — Requirement and environment inspection

Before implementation:

1. Read `IMPLEMENTATION_PLAN.md`, `RULES.md`, `STATUS.md`, and `SUPER_MAIN_PROMPT.md`.
2. Inspect every PDF in `SE_Lab_PDF_docs/`; preserve its terminology and scope.
3. Inspect the workspace, Git state, installed runtimes, and existing code if any.
4. Confirm whether Supabase project credentials and CLI are available without printing secrets.
5. Update `STATUS.md` with the actual baseline and any setup blockers.
6. Do not start later phases or build a full set of module placeholders.

## 8. Phase 1 — Authentication, app layout, and Portfolio Management

**This is the only phase initially authorized.**

### Authentication and profile roles

- Login and logout work through Supabase Auth.
- Protect all application routes and API data.
- Store SEPMS role/profile information in an application-owned table linked to the Supabase Auth user ID.
- Provide instructions or a server-side provisioning script for demo users. Do not create or publish passwords without the user's configuration/approval.
- The backend obtains identity from a verified access token, then resolves role and membership from trusted records.

### App layout

Create a polished, responsive enterprise dashboard with persistent navigation:

- Dashboard
- Portfolios
- Transactions (planned until Phase 2)
- Analytics & Risks (planned until Phase 3)
- Settings (only basic profile/logout or settings that are genuinely implemented)

The dashboard may show real Phase 1 metrics such as portfolio counts and active/archived counts. Do not display invented expenses, risks, or charts before those modules exist.

### Portfolio listing

Display all portfolios to every authenticated user, including archived ones. Include:

- Portfolio name and ID.
- Description.
- Owner.
- Target budget and currency.
- Start and end dates.
- Active/archived status.
- Created/updated timestamps where useful.

Add useful search, sorting, filters, loading, error, and empty states.

### Create portfolio

Fields:

- Name.
- Description.
- Target budget.
- Currency.
- Start date.
- End date.
- Optional team members, if the profile/membership implementation is ready.

Validate on both client and server. Use proper monetary numeric handling; never use floating-point arithmetic for persisted monetary totals if it can create rounding errors. The creator is assigned as owner in a consistent server/database operation.

### Detail and edit

- Provide a portfolio detail page with accurate metadata, owner, members, budget, dates, and current status.
- Only the owner or system administrator can edit.
- Add a revision/version check or another optimistic concurrency strategy to reject stale updates rather than silently overwriting newer changes.

### Archive and deletion integrity

- Implement archive instead of a casual permanent-delete flow.
- Once financial or milestone transaction history exists, the portfolio must not be hard-deleted.
- Archived portfolios remain visible to authenticated users and available for historical viewing.

### Phase 1 acceptance checklist

- [ ] Login/logout use Supabase Auth.
- [ ] Protected UI routes and API endpoints enforce authentication.
- [ ] All authenticated users can view all portfolios.
- [ ] Server-side owner/admin write permissions work.
- [ ] Portfolio creator becomes owner.
- [ ] List, search/filter, create, detail, edit, and archive workflows work.
- [ ] Data persists in the actual Supabase PostgreSQL project.
- [ ] Migrations are versioned SQL files, not ORM schema files.
- [ ] Loading, empty, validation, error, and permission states work.
- [ ] Relevant automated tests and build/type checks pass.
- [ ] `README.md` includes true setup/run instructions.
- [ ] `STATUS.md` contains actual results, not assumptions.

After completing Phase 1, update the documentation and stop for explicit user approval. Do not start Phase 2.

## 9. Phase 2 — Transaction and Milestone Tracking

Start only after the user explicitly approves Phase 1.

### Financial transactions

Fields include portfolio, amount, currency, category, date, description, and justification. Example categories: infrastructure, vendor, labor, software licensing, and other project expense. Support USD, EUR, GBP, and INR. Preserve the original amount/currency; do not aggregate different currencies without a configured and documented conversion rate.

List transactions in a searchable/filterable history with date, portfolio, category, description, amount/currency, source, actor, and reversal state as applicable.

### Milestones

Fields include portfolio, name, target date, actual date when applicable, status (`Pending`, `Completed`, or `Missed`), and notes. Validate completion dates and show overdue pending items distinctly.

### Immutable financial history

- Never hard-delete a transaction through ordinary UI/API functionality.
- Correct financial entries with an offset/reversal linked to the original and carrying a justification.
- Preserve original and reversing entries.
- Prevent over-reversal and duplicate requests.
- Calculate net spending consistently.
- Use atomic database transactions for related writes.
- Record actor/integration identity, timestamp, and request IP when available and appropriate.
- If a portfolio has transaction history, it remains archivable but not hard-deletable.

### Phase 2 acceptance checklist

- [ ] Only owner/admin can mutate authorized portfolio transaction/milestone data.
- [ ] Financial transactions and milestones persist and appear in history.
- [ ] Validation and transaction reversal rules work.
- [ ] Budget and milestone summaries are derived from persisted data.
- [ ] Tests prove data integrity and authorization.
- [ ] `STATUS.md` is updated, then stop for approval before Phase 3.

## 10. Phase 3 — Analytics and Basic Risk Assessment

Start only after the user explicitly approves Phase 2.

### Analytics

Calculate from real database records:

- Target budget, net recorded spending, remaining budget, utilization.
- Spending over time and actual spending versus budget.
- Total/completed/pending/missed/overdue milestones.
- Clear portfolio-level summary and filters.

Handle reversals correctly. Use Recharts for visualizations. Do not use fixed example numbers as though they came from the database.

### Basic financial risk

The SRS specifies a warning when projected final costs exceed the target budget by **more than 10%**. Show target budget, actual spending, projection where sufficient data exists, variance, status, and a plain-language explanation. Do not make false projections when the timeline or history is insufficient.

### Basic schedule risk

Flag missed milestones and overdue pending milestones. Explain the affected milestone, target date, and reason.

### Overall health

Use understandable statuses:

- Green: no material risk detected by implemented rules.
- Yellow: warning/moderate risk found.
- Red: significant risk found.
- Unknown: insufficient or unavailable evidence.

Use simple, configurable, documented initial rules. The SRS does not finalize overall risk aggregation weights; label any default scoring as provisional. Never mark a portfolio Red merely because data is missing.

### Phase 3 acceptance checklist

- [ ] Analytics comes from persisted portfolio/transaction/milestone data.
- [ ] Reversal-aware totals are correct.
- [ ] Financial risk threshold is implemented and tested.
- [ ] Schedule risk is explained and tested.
- [ ] Insufficient data shows Unknown rather than fabricated risk.
- [ ] Charts and filters work with real data.
- [ ] `STATUS.md` and `README.md` reflect actual delivery.

## 11. Database model direction

Use SQL migrations to create and modify schema. Do not use Prisma or another ORM.

Core model candidates:

- `user_profiles`: application profile linked to `auth.users.id`, name, application role, active state, timestamps. Do not expose privileged role changes to normal users.
- `portfolios`: UUID, name, description, target budget (`numeric`/`decimal` SQL type), currency, dates, status, `created_by`, version, timestamps.
- `portfolio_memberships`: portfolio/user references, membership role (Owner/Contributor), assigned timestamp. Enforce one clear owner per portfolio through database constraints or transaction-safe server logic.
- Phase 2: `transactions` (or clearly normalized financial/milestone tables), reversal reference, external idempotency reference where needed, source, actor, timestamps.
- Phase 3: `analytics_snapshots`, `risk_profiles`, and `risk_vectors` if history is needed.
- `audit_logs` for important mutations.

Choose names/normalization that fit the final SQL schema, but document the selected model in `README.md`. Use foreign keys, indexes, unique constraints, and `numeric` for money. Use UUIDs for application-owned entities where appropriate.

## 12. SQL security and data access rules

- All SQL must be parameterized.
- Keep `DATABASE_URL` server-side and never place it in a frontend environment variable.
- Enable RLS on exposed tables and define/test policies. Remember: Supabase secret/service-role API keys bypass RLS, and a privileged PostgreSQL connection can also bypass RLS. Do not claim policies protect a query when its runtime database role bypasses them.
- Prefer a restricted runtime database role with only required permissions. If using RLS as a per-user defense-in-depth layer with the `pg` driver, bind the verified user context inside a transaction and use a runtime role that does not own tables and does not bypass RLS. Avoid leaking user context between pooled requests; use transaction-local settings and always commit/rollback safely.
- Regardless of RLS setup, Express must enforce authenticated identity, role, and owner/admin rules for every mutation.
- Never expose or log secret keys, passwords, access/refresh tokens, or full connection strings.
- Use TLS for database connections and appropriate pooling/connection settings for the chosen Supabase connection mode.
- Do not directly insert or update rows in Supabase internal Auth tables. Use Supabase Auth APIs/Dashboard for user provisioning.

## 13. Quality, tests, and handover

At each phase:

1. Implement the phase end to end; do not stop at a plan or scaffold.
2. Run migrations against the configured database where credentials exist.
3. Run frontend and backend lint/type/build checks.
4. Run relevant tests and record actual commands/outcomes.
5. Inspect browser behavior when browser tooling is available.
6. Fix issues found.
7. Update `STATUS.md` and `README.md` with accurate results.
8. Summarize completed work, setup/run commands, tests, limitations, and blockers.
9. Stop and await explicit approval before starting the next phase.

Do not invent successful test results, database connectivity, external integration state, or deployment status. If credentials are absent, complete the code/schema work possible without them and state exactly what remains to be configured and tested.
