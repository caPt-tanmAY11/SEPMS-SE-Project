# SUPER MAIN PROMPT — SE Portfolio Management System (SEPMS)

## 1. Your Role and Objective

You are the senior full-stack developer, software architect, database designer, and UI/UX engineer responsible for building my Software Engineering college lab project: **Software Engineering Portfolio Management System (SEPMS)**.

Your task is to initialize the application from scratch, implement it incrementally, test each phase, and maintain the project documentation as development progresses.

The project root currently contains the following files and directory:

- `IMPLEMENTATION_PLAN.md` — project scope, architecture, phased development plan, and acceptance criteria.
- `RULES.md` — mandatory coding, security, database, authorization, and development rules.
- `STATUS.md` — implementation progress, testing results, blockers, and current phase.
- `SE_Lab_PDF_docs/` — directory containing the four original Software Engineering lab project PDFs.

Read these files and understand their contents before implementing anything.

**The three Markdown files are persistent project instructions. This prompt is the immediate task instruction. Follow all of them consistently.**

Do not assume an existing application, database schema, frontend, or backend has already been created. Inspect the repository first, then initialize everything required.

## 2. Understand the Original Project Requirements

Read `IMPLEMENTATION_PLAN.md`, `RULES.md`, and `STATUS.md` completely.

Next, inspect all four PDFs inside `SE_Lab_PDF_docs/`:

1. Software Requirements Specification (SRS).
2. Use Case Diagram and Use Case Descriptions.
3. Class Diagram.
4. Sequence Diagram and Communication Diagram.

Use the documents to understand the application's purpose, users, use cases, domain entities, relationships, workflows, and business rules.

Treat the SRS as the primary reference for functional and nonfunctional requirements. Use the UML diagrams to understand the system structure and interactions. Use the Markdown files to follow the selected implementation approach and development restrictions.

Inspect diagrams visually when their extracted text does not adequately describe them.

Do not replace the requirements with a generic project management application, a stock portfolio tracker, or an unrelated financial investment application.

**SEPMS manages software engineering projects and their technical assets, budgets, transactions, milestones, performance, and risks.** Financial transactions refer to organizational project expenses and budget consumption, not personal investments.

If a document leaves something undecided, identify the ambiguity and make only the minimum practical implementation decision needed for the current phase. Document important assumptions instead of pretending they came from the source material.

Do not modify or delete the original PDFs. Do not weaken the rules in `RULES.md` or silently change the project's intended scope.

## 3. What We Are Building

SEPMS is a centralized web application that allows an organization to manage software engineering portfolios and understand their current status.

A portfolio may represent a software development project, a maintenance initiative, or a collection of related engineering resources.

The application will eventually contain three core modules:

1. **Portfolio Creation and Management**
2. **Transaction and Milestone Tracking**
3. **Analytics and Basic Risk Assessment**

We will implement these modules **one at a time**, with explicit approval between phases.

For the current task, implement Phase 1 only. The remaining modules must not be implemented until I approve the preceding phase.

### Phase roadmap

- **Phase 1:** Authentication, application layout, and Portfolio Management.
- **Phase 2:** Financial Transactions and Milestone Tracking.
- **Phase 3:** Analytics and Basic Risk Assessment.

Do not implement report generation, PDF/CSV exports, advanced GitHub/Jira integrations, automated email reports, enterprise SSO, or other optional enterprise features during the current phase.

Design the application so that future modules can be added cleanly without unnecessarily rewriting Phase 1.

## 4. Mandatory Technology Stack

Use this stack unless an existing project constraint or an explicit instruction in the project files requires otherwise.

### Frontend

- React.js.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn/ui or an equivalent accessible component library.
- React Router for navigation.
- TanStack Query for fetching, caching, and updating API data.
- React Hook Form and Zod for forms and validation.
- Lucide React for icons.
- Recharts when charting is needed in Phase 3.

### Backend

- Node.js.
- Express.js.
- TypeScript.
- RESTful API architecture.
- Supabase Auth token verification.
- The official PostgreSQL `pg` driver for SQL queries.
- Zod for backend request validation.

### Database and authentication

- Supabase PostgreSQL for persistent relational data.
- Supabase Auth for user authentication.
- SQL migrations, preferably managed through the Supabase CLI.
- Database access through the Express backend using parameterized SQL queries.

### Absolutely no ORM

**Do not use Prisma, Sequelize, TypeORM, Drizzle ORM, or any other ORM.**

Do not create `schema.prisma`, Prisma configuration, Prisma migrations, or ORM-generated models.

Use SQL migration files to define and evolve the database schema, and use the `pg` driver for backend queries. You may create typed TypeScript interfaces and validation schemas, but these must not become an ORM or attempt to replace SQL with an ORM abstraction.

### Recommended project structure

Create a maintainable project structure similar to:

```text
SEPMS/
├── IMPLEMENTATION_PLAN.md
├── RULES.md
├── STATUS.md
├── SUPER_MAIN_PROMPT.md
├── SE_Lab_PDF_docs/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       ├── layouts/
│   │       ├── pages/
│   │       ├── features/
│   │       ├── hooks/
│   │       ├── lib/
│   │       └── routes/
│   └── api/
│       └── src/
│           ├── config/
│           ├── middleware/
│           ├── modules/
│           │   ├── auth/
│           │   ├── users/
│           │   └── portfolios/
│           ├── database/
│           ├── utils/
│           └── app.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── scripts/
├── tests/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
└── README.md
```

Adapt the structure where necessary, but maintain clear separation between frontend, backend, database migrations, API routes, business logic, and shared utilities.

Do not create unnecessary files or packages merely to imitate this structure.

## 5. Supabase Setup and Database Access

Supabase is the actual database and authentication provider for this project. Do not substitute a local JSON file, browser storage, an in-memory array, or a separate local database for persistent application data.

### Database access

Use the `pg` driver inside Express to connect to Supabase PostgreSQL.

Create SQL migration files for tables, relationships, constraints, indexes, triggers, and other database objects required by the current phase.

Use parameterized SQL queries. Never construct SQL queries by directly concatenating user input.

The frontend must send application data requests to the Express API. Portfolio CRUD operations must not bypass the backend by querying database tables directly from browser components.

### Authentication

Use Supabase Auth for sign-in, sign-out, and user sessions.

The frontend may use `@supabase/supabase-js` for authentication operations. It must obtain the current user's access token and send it to the Express API using an Authorization Bearer header.

The Express middleware must verify the token and retrieve the authenticated user's identity before allowing protected operations.

Do not trust client-supplied user IDs, role names, or authentication flags.

### Environment configuration

Create `.env.example` with documented placeholders for the environment variables required by the actual implementation, including the applicable equivalents of:

- Supabase project URL.
- Supabase publishable key for the frontend.
- Supabase URL and publishable key for backend token verification.
- Supabase PostgreSQL connection string.
- Frontend API base URL.
- Any other genuinely required development configuration.

Use the Vite environment-variable prefix for values intentionally exposed to the browser.

Keep the database connection string, database credentials, and any Supabase secret or service-role keys exclusively on the server. Never expose privileged keys through frontend environment variables.

Do not hardcode actual credentials, invent a Supabase project URL, or claim that the database is connected when valid configuration has not been provided.

### Supabase security

Enforce authentication and authorization on all protected API routes.

Enable and configure Supabase Row Level Security where appropriate. Do not assume RLS protects queries made using a privileged database connection that bypasses RLS. Regardless of the database connection method, explicitly enforce all applicable business permissions in Express.

Do not expose public write access to portfolio, membership, profile-role, or transaction tables.

### Missing Supabase credentials

If I have not yet provided Supabase project credentials:

1. Create the complete integration code and SQL migrations.
2. Provide a usable `.env.example`.
3. Document how to create a Supabase project, configure its keys, apply migrations, and run the application.
4. Continue with available static checks, automated tests, and other verification that does not require the live database.
5. Clearly distinguish completed implementation from unverified live Supabase integration.

Do not invent connection details or falsely claim successful database testing.

Do not block all development simply because external credentials have not yet been configured.

## 6. Users, Authentication, and Authorization

Support these user types:

### A. Project / Portfolio Manager

Can create portfolios, manage portfolios they own, assign team members, edit authorized portfolio metadata, and archive eligible portfolios.

### B. Software Developer / Engineer

Can view all portfolios, inspect details and ownership, and later review transaction history, analytics, and risk assessments. Read-only access is the default.

### C. Executive Leadership

Can view all portfolios and later compare budgets, performance, milestone progress, and portfolio risks. The interface should make important information easy to interpret.

### D. System Administrator

Can manage system-level settings and perform authorized administrative portfolio operations.

### Mandatory permission rules

1. Anonymous users must not access protected application data.
2. Every authenticated user must be able to view every portfolio and its applicable details.
3. There must be no private portfolios or department-specific restrictions on reading portfolios.
4. Only an assigned Portfolio Owner or a System Administrator can perform authorized portfolio modifications.
5. A Project / Portfolio Manager who creates a portfolio automatically becomes its Portfolio Owner.
6. Being a Portfolio Manager, developer, executive, or ordinary portfolio member must not automatically grant permission to modify every portfolio.
7. Membership and ownership must be represented correctly in the database.
8. The frontend must show or disable controls according to the user's permissions, but the backend remains the authority.
9. Return HTTP 401 for unauthenticated requests and HTTP 403 for authenticated users who lack the required permission.
10. Never rely on a user-controlled role selector to grant access.

Store profile information and application roles using an appropriate database model associated with the authenticated Supabase user.

Supabase Auth manages authentication identities. Do not attempt to create fake authentication users merely by inserting records into application profile tables.

For the college demo, document how to create test users through Supabase Auth and assign their development roles safely. Use an optional server-only administrative seed script only if genuinely necessary and appropriately configured; never expose its privileged credentials to the browser.

## 7. Phase 1: Authentication, Layout, and Portfolio Management

**This is the only phase you are authorized to implement now.**

### A. Authentication and session handling

Create a working login page connected to Supabase Auth.

Implement:
- Login.
- Logout.
- Persistent and correctly restored authenticated sessions.
- Protected application routes.
- Authenticated API requests.
- User profile retrieval.
- Role-aware navigation and actions.
- Friendly invalid-credentials and session-expiration handling.

Do not build a decorative login page that simply navigates into the dashboard without authenticating the user.

### B. Application layout

Build a professional, consistent enterprise-style interface.

Include a persistent sidebar with:
- Dashboard.
- Portfolios.
- Transactions.
- Analytics & Risks.
- Settings.

For Phase 1, fully implement the Dashboard basics and the Portfolios module.

Future modules must be clearly marked as coming later or remain nonfunctional navigation placeholders. Do not make their buttons appear to work when the underlying features have not been implemented.

The top navigation should display the current user and provide a working logout action.

Use clear typography, balanced spacing, accessible contrast, reusable components, loading skeletons, empty states, form validation, confirmation dialogs, and non-intrusive notifications.

The application should work well on desktop browsers and adapt to tablet layouts.

### C. Dashboard

Build an initial dashboard that retrieves real data from the backend.

It may display:
- Total portfolio count.
- Active portfolio count.
- Archived portfolio count.
- Recently created portfolios.
- Useful links to the portfolio list and creation form.

Do not display invented budget totals, transaction charts, milestone counts, risk scores, or other data that has not yet been implemented.

The dashboard must reflect changes made through portfolio operations.

### D. Portfolio listing

Build a complete portfolio listing page.

Show, where applicable:
- Portfolio name.
- Unique portfolio ID.
- Description.
- Owner.
- Target budget.
- Currency.
- Start and end dates.
- Active or archived status.
- Creation or update information.

Implement search, appropriate sorting, status filters, loading and error states, and a useful empty state.

Every authenticated user must be able to view all portfolios.

### E. Create portfolio

Create a functional portfolio creation form containing:

- Name.
- Description.
- Target budget.
- Currency.
- Start date.
- End date.
- Optional team member assignments, if supported by the implemented membership workflow.

Validate the form on both frontend and backend.

For the initial version, support USD, EUR, GBP, and INR. Preserve budget currency correctly. Do not add currency conversion unless it is required and properly implemented later.

When the form is submitted:

1. Verify the user's authentication.
2. Verify that the user's role permits portfolio creation.
3. Validate all fields on the backend.
4. Generate a unique portfolio ID.
5. Save the portfolio in Supabase PostgreSQL.
6. Assign the creator as Portfolio Owner.
7. Record the appropriate ownership and membership relationships.
8. Return the persisted record.
9. Show a confirmation and update the displayed list without relying on hardcoded mock data.

### F. Portfolio details

Create a dedicated page for each portfolio.

Display:
- Portfolio metadata.
- Owner.
- Team members, where assigned.
- Budget and currency.
- Start and end dates.
- Active or archived status.
- Relevant timestamps.

Structure the details page so transaction history, analytics, and risk information can be integrated into future phases without redesigning the entire application.

### G. Edit portfolio

Authorized owners and administrators can update applicable portfolio metadata.

Enforce permission checks on the Express API and validate update requests.

Prevent stale changes from silently overwriting a more recent update. Implement a version field or equivalent optimistic concurrency mechanism and return an appropriate conflict response when necessary.

Do not let users change the owner or membership records through unvalidated arbitrary fields.

### H. Archive portfolio

Implement portfolio archiving rather than hard deletion.

A portfolio with existing financial or milestone transactions must not be permanently deleted. Archived portfolios must remain visible to authenticated users and retain their historical data for future reporting.

Even though the later transaction module is not implemented yet, design the portfolio lifecycle so introducing transactions cannot compromise this rule.

Do not expose a general portfolio hard-delete endpoint.

### I. User and membership management

Create the database relationships necessary for portfolio ownership and membership.

At minimum, establish an appropriate structure for:
- User profiles associated with Supabase Auth identities.
- Portfolios.
- Portfolio memberships.

A user may belong to multiple portfolios. A portfolio may contain multiple users.

Enforce uniqueness and referential integrity for membership relationships.

A normal Contributor membership does not automatically grant portfolio modification rights.

## 8. Database and REST API Design

Design the Phase 1 database using SQL migrations and Supabase PostgreSQL.

Use appropriate:
- UUID identifiers.
- Foreign keys.
- Unique constraints.
- Check constraints.
- Indexes.
- Created and updated timestamps.
- Monetary numeric types.
- Validated currency and status values.
- Ownership and membership relationships.

Create only the database entities necessary for Phase 1, while allowing future transaction and analytics modules to be added cleanly.

Provide a versioned REST API with endpoints appropriate for:
- Authentication verification and current-user details.
- User/profile retrieval required by the UI.
- Portfolio listing.
- Portfolio creation.
- Portfolio detail retrieval.
- Portfolio metadata updates.
- Portfolio archiving.
- Authorized user/member lookups where needed.

You may refine endpoint names, but all portfolio actions must use real backend functionality.

Use the appropriate HTTP methods and status codes. Centralize error handling and return consistent response formats.

Keep route handlers, authorization middleware, SQL queries, validation, and business logic organized into maintainable modules.

Do not expose an ordinary portfolio or transaction deletion operation that violates the project's integrity rules.

## 9. Phase 1 Testing Requirements

Write and execute meaningful tests for the current implementation.

Verify:

1. Login with valid Supabase Auth credentials.
2. Rejection of invalid login attempts.
3. Protected routes reject unauthenticated users.
4. Logout and session handling work correctly.
5. Every authenticated user can list and view portfolios.
6. A Portfolio Manager can create a portfolio.
7. The creator becomes its Portfolio Owner.
8. An authorized owner can update portfolio details.
9. Unauthorized users cannot update another owner's portfolio.
10. A System Administrator can perform the intended administrative operations.
11. Portfolio archiving preserves the portfolio record.
12. Data persists after refreshing the browser.
13. Search, filters, and navigation operate correctly.
14. Database validation and API error states are handled gracefully.

Run the applicable TypeScript checks, linting, build commands, and automated tests.

If a test requires unavailable Supabase credentials, report that limitation honestly and execute all other available checks.

Do not claim that the live database, authentication, deployment, or performance has been verified unless it was actually tested.

## 10. Required Project Documentation and Setup

Create a useful `README.md` containing:

- Project overview.
- Technology stack.
- Architecture and folder structure.
- Prerequisites.
- Supabase project creation and setup.
- Required environment variables.
- SQL migration instructions.
- Supabase Auth configuration.
- Development user and role setup.
- Installation commands.
- Frontend and backend run commands.
- Test and build commands.
- Common troubleshooting steps.
- Known limitations and future development phases.

Update `IMPLEMENTATION_PLAN.md` only when necessary to reflect genuine decisions and completed work. Do not silently change the project's requirements.

Keep `RULES.md` intact as the persistent set of project rules. If it needs a genuine correction, explain the reason rather than modifying it silently.

Maintain `STATUS.md` throughout development. Update it before starting work, when meaningful milestones are reached, and when finishing the phase.

Record:
- Current phase and status.
- Implemented features.
- Files and modules created.
- Database migrations.
- Environment setup requirements.
- Actual test and build results.
- Known bugs and blockers.
- Exact commands required to run the application.
- Features awaiting my approval.

Documentation must describe the actual implementation, not planned or fictional functionality.

## 11. Development Workflow

Follow this order.

### Step 1: Inspect

Read all three project Markdown files and inspect all four PDFs. Inspect the repository and available tooling. Establish the starting point in `STATUS.md`.

### Step 2: Plan briefly

Identify the files, database objects, and modules required for Phase 1. Resolve practical implementation details without expanding the approved scope.

### Step 3: Initialize the project

Create the frontend and backend, configure TypeScript and dependencies, prepare SQL migrations, configure environment variables, and establish the Supabase integration.

### Step 4: Implement Phase 1

Complete authentication, the application layout, the dashboard basics, portfolio listing, portfolio creation, portfolio details, editing, archiving, ownership, and membership behavior.

### Step 5: Verify

Run the available database migrations, checks, builds, and tests. Fix errors before declaring completion.

### Step 6: Document

Update `STATUS.md` and `README.md` with verified progress and actual setup instructions.

### Step 7: Stop for approval

Present the results, remaining limitations, test outcomes, and exact commands to run the application.

**Stop after Phase 1. Wait for my explicit approval before implementing Phase 2.**

Do not proceed automatically just because Phase 1 is complete. Phase 2 and Phase 3 require separate approval.

## 12. Important Restrictions

- No Prisma or any other ORM.
- No replacing Supabase with a different database.
- No fake authentication.
- No hardcoded mock data presented as real application data.
- No client-controlled authorization.
- No privileged Supabase keys exposed in the browser.
- No hard deletion of portfolios or future historical transactions in violation of the specified rules.
- No implementation of unapproved modules.
- No modification or deletion of the original lab PDFs.
- No overwriting the project instruction files with incomplete summaries.
- No claiming that a feature or test works without verifying it.
- No stopping after generating a plan, scaffold, or static UI.

Prefer a clean, maintainable, working implementation over unnecessary abstraction or infrastructure.

## Final Instruction

Begin now.

First read `IMPLEMENTATION_PLAN.md`, `RULES.md`, and `STATUS.md`. Then inspect all four PDFs in `SE_Lab_PDF_docs/` and review the available project environment.

Initialize the SEPMS application from scratch using **React + TypeScript + Vite, Express + TypeScript, Supabase PostgreSQL, Supabase Auth, and the `pg` driver with SQL migrations**.

Implement **Phase 1 only**, test it, update the documentation, and report the verified outcome.

Do not begin Phase 2 or Phase 3 without my explicit approval.
