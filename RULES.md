# SEPMS — Persistent Coding Agent Rules

These rules govern Antigravity throughout the SEPMS project. Read this file, `IMPLEMENTATION_PLAN.md`, `STATUS.md`, and `SUPER_MAIN_PROMPT.md` before making changes. The user-provided SE lab PDFs in `SE_Lab_PDF_docs/` are requirements references.

## 1. Source of truth

1. The SRS and UML/lab PDFs are the source material for documented requirements.
2. `IMPLEMENTATION_PLAN.md` defines the agreed three-module MVP, stack, and phase order.
3. `RULES.md` defines non-negotiable technical and business rules.
4. `STATUS.md` records what is actually implemented and verified; keep it factual.
5. `SUPER_MAIN_PROMPT.md` is the start-of-project instruction and reinforces Phase 1 only.
6. Follow any newer, explicit user instruction that changes scope or approves the next phase.
7. Do not silently invent important requirements. If a decision is unavoidable, choose the smallest safe assumption, make it configurable when sensible, and document it.

## 2. Scope and phased approval — mandatory

The current MVP has exactly three modules:

1. Portfolio Creation and Management.
2. Transaction and Milestone Tracking.
3. Analytics and Basic Risk Assessment.

The first authorized phase is **Phase 1: Supabase Auth, application layout, and Portfolio Management**.

- Do not implement Phase 2 until the user explicitly approves Phase 1.
- Do not implement Phase 3 until the user explicitly approves Phase 2.
- Do not implement all three modules in parallel.
- Do not create large nonfunctional placeholder modules and claim completion.
- At each phase boundary, run appropriate checks, update `STATUS.md`, explain results and limitations, and stop for user review.
- Never move to the next phase just because the current code compiles or because the plan lists it.

## 3. Technology constraints: no Prisma, no ORM

The agreed architecture is:

- React + TypeScript + Vite for the frontend.
- Express + Node.js + TypeScript for the backend.
- Supabase Auth for sign-in/session identity.
- Supabase-hosted PostgreSQL for persistence.
- `pg` for server-side SQL queries.
- Versioned plain SQL migrations under `supabase/migrations/`.
- Supabase CLI when available, with documented Dashboard SQL Editor steps as a fallback.

**Strictly prohibited unless the user explicitly approves a change:**

- Prisma ORM, Prisma schema, Prisma Client, or Prisma migrations.
- Drizzle ORM, Sequelize, TypeORM, or any other ORM/query-builder.
- Replacing Supabase PostgreSQL with a local-only database as the primary data store.
- Putting database SQL/query logic directly into React UI components.

Do not generate `schema.prisma`, a `prisma/` directory, `prisma generate`, `prisma migrate`, or setup instructions requiring Prisma.

## 4. Inspect before editing

- Inspect the actual workspace, Git status, files, packages, and installed tools before changing anything.
- Read the four PDFs where accessible; do not infer their full contents from filenames alone.
- Preserve user changes and useful existing code. Do not overwrite work blindly.
- Never modify, remove, rename, or overwrite the original files in `SE_Lab_PDF_docs/`.
- Check whether Supabase credentials, the Supabase CLI, Docker, and Node are available. Do not print secrets to the terminal output or `STATUS.md`.
- If no app exists, scaffold under the current root while keeping the three instruction files, `SUPER_MAIN_PROMPT.md`, and reference PDF directory intact.

## 5. Product definition

SEPMS manages software engineering projects, their budgets, project expenses, teams, assets, milestones, and basic health metrics. It is not an investment, stock, or cryptocurrency app.

Deferred unless explicitly requested: PDF/CSV reporting, recurring email reports, real third-party engineering/ERP integrations, corporate SSO, production-scale distributed infrastructure, and advanced integration-dependent technical-debt analysis.

## 6. Identity, authentication, and authorization

- Use Supabase Auth for real login/logout and authenticated sessions.
- Frontend uses only the public Supabase publishable key (or legacy anon key when required by an existing project).
- The frontend sends its access token to Express as a Bearer token.
- Express verifies the token using a supported Supabase Auth method before trusting the identity. Do not authorize a request using client-side state or an unverified decoded JWT.
- Load SEPMS role and portfolio ownership from trusted application database records; do not accept role/owner claims from request bodies.
- Anonymous users cannot access protected application data.
- All authenticated users can read all portfolios and their relevant records; no private-portfolio or department-based visibility restriction.
- A permitted creator becomes the portfolio owner.
- Only the assigned Portfolio Owner or System Administrator may perform applicable mutations.
- Developer, Executive, and ordinary member labels do not confer owner permissions.
- Enforce all permissions in Express for every mutation and test direct API calls, not just UI controls.
- Return `401` for missing/invalid authentication and `403` for an authenticated user without permission.
- Privileged role changes must be limited to a trusted admin workflow; users must not be able to grant themselves elevated roles.
- Provision Auth users through Supabase Auth APIs or the Dashboard. Never write directly to Supabase internal Auth tables.

## 7. Supabase key and database safety

- Never put a Supabase secret key, legacy service-role key, PostgreSQL password, or `DATABASE_URL` in frontend code or any `VITE_` variable.
- Never commit actual secrets. Supply `.env.example` with blank placeholders.
- Keep admin/secret keys restricted to backend-only provisioning or administrative scripts that truly need them. A Supabase secret/service-role key bypasses RLS.
- Use SQL parameterization for all dynamic values. Validate both type and business meaning server-side.
- Use a connection mode appropriate for the environment and enable TLS.
- Enable RLS for exposed tables and write policies, then test the real access path. **Do not claim RLS secures queries executed with a privileged DB connection or Supabase secret/service-role client that bypasses RLS.**
- Prefer a least-privilege runtime DB role. If per-user RLS is implemented with `pg`, apply verified user context transaction-locally and guarantee commit/rollback so context cannot leak across pooled requests.
- Backend authorization is mandatory even when RLS is enabled.
- Do not log connection strings, passwords, API keys, access tokens, refresh tokens, or secret personal data.

## 8. SQL and schema rules

- Use plain SQL migration files in `supabase/migrations/` with ordered, meaningful names.
- Store safe, non-sensitive example records in `supabase/seed.sql` where practical.
- Auth demo users must be created with Supabase Auth Admin APIs or manually through the Dashboard; a SQL seed must not directly populate `auth.users`.
- Add foreign keys, unique constraints, relevant indexes, timestamps, and checks.
- Use PostgreSQL `numeric`/`decimal` for money; avoid floating-point monetary storage.
- Use UUIDs for application records where appropriate.
- Make portfolio-owner assignment atomic with portfolio creation.
- Ensure archived portfolios remain readable.
- If transaction/milestone history exists, do not permit permanent portfolio deletion.

## 9. Transaction and milestone rules (Phase 2 only after approval)

- Transactions and milestones are historical events and cannot be hard-deleted by ordinary app operations.
- An incorrect financial record is corrected by a reversing/offsetting transaction with a justification; preserve the original.
- A reversal must reference its original and must not exceed the permitted reversible amount.
- Net spending and budget utilization must account for reversals correctly.
- Validate fields appropriate to each transaction type.
- Use database transactions for related writes and prevent duplicate event/reversal submissions.
- Record source, actor, and timestamp for important writes; record request IP when available and appropriate.

## 10. Analytics and risk rules (Phase 3 only after approval)

- Charts and KPIs must be derived from persisted records, not fixed demo values.
- The specified financial warning threshold is a projected final cost **more than 10% above target budget**.
- Flag missed milestones and overdue pending milestones as schedule risks.
- Show the evidence/reason for every warning.
- If there is insufficient information, show `Unknown`/`Insufficient data`; do not invent metrics or automatically mark the portfolio Red solely because data is missing.
- Overall risk weights are not finalized in the source SRS. Make defaults configurable and identify them as provisional.

## 11. Quality and UX rules

- Every implemented button, form, filter, link, and chart interaction must work or clearly state why it is unavailable.
- Do not use placeholder handlers that show success without a real operation.
- Include loading, empty, validation, error, and permission-denied states.
- Keep the UI responsive and accessible, with consistent reusable components.
- Keep business logic out of large UI components and keep route handlers thin.
- Add tests for critical business rules and authorization.
- Run lint, type-check, build, migrations, and tests that are actually available. Fix failures before claiming completion.
- Be truthful about untested paths or unavailable Supabase credentials.

## 12. STATUS.md and handover protocol

At the start of work, update `STATUS.md` to reflect what has actually been inspected. Update it after meaningful implementation work and before each handover.

At a phase boundary, include:

- What works now.
- Main files/features added or changed.
- Actual commands run and actual results.
- Database/migration state.
- Known bugs, missing configuration, and limitations.
- Exact setup/run/test commands.
- Current phase state and the next phase waiting for user approval.

Never mark code or tests complete just because files were generated. Do not claim database connectivity or successful testing if credentials were absent or commands were not run.
