# Software Engineering Portfolio Management System (SEPMS)

> **College Lab Project — Software Engineering (SE)**  
> **Prepared by:** Tanmay Vishwakarma & Devraj Sundrani  
> **Institution:** Sardar Patel Institute of Technology  
> **Phase Status:** Phase 1 Complete (Awaiting User Approval for Phase 2)

---

## 1. Project Overview

The **Software Engineering Portfolio Management System (SEPMS)** is a centralized, transparent web platform designed to manage and monitor software engineering initiatives, technical assets, budgets, milestones, and project health metrics.

A portfolio represents a software development project, maintenance initiative, or collection of engineering assets. SEPMS provides organizational visibility into project delivery without personal investment or financial market abstractions.

### Core Modules Roadmap
1. **Phase 1 (Complete):** Authentication (Supabase Auth), Enterprise Layout, Portfolio Management, Optimistic Concurrency Control (OCC), and Deletion Protection.
2. **Phase 2 (Planned):** Financial Transactions (cloud costs, vendor, labor with reversal auditing) and Milestone Tracking.
3. **Phase 3 (Planned):** Performance Analytics (budget burn-down, velocity) and Early Risk Detection (budget overrun alerts >10%, schedule slippage).

---

## 2. Technology Stack

- **Frontend:**
  - React 18 + TypeScript + Vite
  - Tailwind CSS with rich enterprise dark aesthetic & glassmorphism
  - Lucide React icons
  - TanStack Query (v5) for asynchronous state management and caching
  - React Hook Form + Zod for client-side form validation
  - React Router (v7) for client-side routing
- **Backend:**
  - Node.js + Express.js + TypeScript
  - Official PostgreSQL `pg` driver with connection pooling (`pg.Pool`)
  - Supabase Auth token verification via `@supabase/supabase-js`
  - Zod for backend request validation
  - RESTful architecture with parameterized SQL queries (strictly **no ORM**)
- **Database & Identity:**
  - Supabase-hosted PostgreSQL
  - Supabase Auth
  - Versioned plain SQL migrations (`supabase/migrations/`)

---

## 3. Architecture & Repository Structure

```text
SEPMS/
├── IMPLEMENTATION_PLAN.md      # Agreed MVP scope, architecture, and phase criteria
├── RULES.md                    # Mandatory coding, security, and integrity rules
├── STATUS.md                   # Real-time progress and verification log
├── SUPER_MAIN_PROMPT.md        # Immediate task instructions
├── README.md                   # Project documentation and setup guide
├── SE_Lab_PDF_docs/            # Original 4 lab PDFs (SRS, Use Cases, Class & Sequence Diagrams)
├── apps/
│   ├── web/                    # React + Vite frontend client
│   │   ├── src/
│   │   │   ├── context/        # AuthContext & Persona switcher
│   │   │   ├── layouts/        # AppLayout with persistent sidebar & header
│   │   │   ├── pages/          # Login, Dashboard, Portfolios, Create, Detail, Settings
│   │   │   ├── lib/            # Supabase and API clients
│   │   │   └── App.tsx         # Route definitions and query providers
│   └── api/                    # Express.js REST API backend
│       └── src/
│           ├── config/         # Environment configuration
│           ├── database/       # pg.Pool connection & query execution
│           ├── middleware/     # Auth token verification, RBAC, Zod validation, error handler
│           ├── modules/
│           │   ├── auth/       # /api/v1/auth/me
│           │   ├── users/      # /api/v1/users
│           │   └── portfolios/ # /api/v1/portfolios (CRUD, OCC, archive, stats)
│           ├── __tests__/      # Automated integration test suite
│           └── server.ts       # API server entrypoint
├── supabase/
│   ├── config.toml             # Supabase CLI config
│   ├── migrations/             # SQL migrations (20261011000001_phase1_init.sql)
│   └── seed.sql                # Non-sensitive database seed data
├── scripts/
│   └── provision_demo_users.ts # Server-side demo account provisioning script
├── docker-compose.yml          # Optional local PostgreSQL service
└── package.json                # npm workspaces root configuration
```

---

## 4. User Personas & Access Model

Per the SRS Universal Read Access mandate (**BR-01**), all authenticated employees have complete visibility into all portfolios and assets. Modification is strictly guarded by backend RBAC:

| Persona | Role | Permissions |
|---|---|---|
| **Alex Vance** | `PORTFOLIO_MANAGER` | Can create portfolios, manage/edit owned portfolios, assign members, archive. |
| **Devon Lee** | `DEVELOPER` | Read-only access to all portfolios, engineering assets, and timelines. |
| **Elena Rostova** | `EXECUTIVE` | Read-only access to cross-portfolio dashboards, KPIs, and governance. |
| **Sam Altman** | `ADMIN` | System administrator with global maintenance and update privileges. |

---

## 5. Setup and Prerequisites

### Prerequisites
- **Node.js:** v18+ (tested on Node v24.21.0)
- **npm:** v9+ (tested on npm 11.19.0)
- Optional: Supabase CLI (`npx supabase`) or a free Supabase cloud account

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your Supabase project keys if you have a live Supabase project:
```dotenv
# Frontend (public)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
VITE_API_BASE_URL=http://localhost:3001/api/v1

# Backend (server-only)
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-publishable-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # For provisioning only
```

*(Note: If you run without external Supabase credentials, the application automatically boots in offline mock mode with built-in personas so the entire application can be demoed and tested immediately).*

### Step 3: Apply SQL Migrations
- **Using Supabase Dashboard:** Open the SQL Editor in your Supabase project and execute [`supabase/migrations/20261011000001_phase1_init.sql`](file:///home/tanmayy/CLG_RELATED_PROJECTS/SE/supabase/migrations/20261011000001_phase1_init.sql).
- **Using Supabase CLI:** Run `npx supabase db push`.

### Step 4: Provision Demo Accounts (Live Supabase)
If connected to a live Supabase project, provision the 4 test personas:
```bash
npx ts-node scripts/provision_demo_users.ts
```

---

## 6. Running the Application

### Option A: Run Both Frontend and Backend Concurrently
From the root:
```bash
npm run dev
```

### Option B: Run Individually
In terminal 1 (Backend API):
```bash
npm run dev:api
# Running on http://localhost:3001
```

In terminal 2 (Web Frontend):
```bash
npm run dev:web
# Running on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**.

---

## 7. Verification & Automated Testing

### Run All Workspace Tests
```bash
npm run test
```
- Tests 13 backend integration scenarios using Vitest and Supertest:
  1. 401 Unauthorized rejection for missing Bearer tokens.
  2. Profile retrieval via `/api/v1/auth/me`.
  3. Universal Read Access verification across PM, Developer, Executive.
  4. Portfolio creation with atomic Owner assignment.
  5. 403 Forbidden rejection when Developer attempts portfolio creation.
  6. Authorized owner updating portfolio metadata.
  7. **Optimistic Concurrency Control (OCC):** 409 Conflict rejection on stale versions.
  8. 403 Forbidden rejection when non-owner attempts portfolio modification.
  9. System Administrator override for maintenance.
  10. **Archive integrity:** Portfolio transition to `ARCHIVED` status without record deletion.
  11. **Hard deletion prohibition:** 405 Method Not Allowed on `DELETE /api/v1/portfolios/:id`.
  12. Zod validation rejection for invalid date spans.
  13. Real aggregated stats calculation on `/api/v1/portfolios/stats`.

### Run TypeScript & Build Verification
```bash
npm run lint
npm run build
```

---

## 8. College Lab Demo Guide

1. **Sign In / Persona Switcher:**
   - Go to `http://localhost:5173/login`. Click **Portfolio Manager** (`pm@sepms.local`).
2. **Dashboard Review:**
   - Real KPI metric cards for Total, Active, and Archived Portfolios.
3. **Universal Read Access:**
   - Go to **Portfolios** in sidebar. Notice all engineering portfolios are visible.
4. **Create a Portfolio:**
   - Click **Create Portfolio**. Fill name, description, budget, and dates. Assign team contributors.
   - Creator is automatically set as the Portfolio Owner.
5. **Optimistic Concurrency Control:**
   - Edit portfolio and observe version incrementing (`v1` → `v2`). Stale edits are rejected with HTTP 409.
6. **Role Enforcement (RBAC):**
   - Click the **Switch Persona** button in the sidebar footer and switch to **Software Developer**.
   - Notice the "Edit Portfolio" button immediately transforms into a disabled **"Read-Only Viewer"** badge, preventing unauthorized mutation.
7. **Archive (Non-Destructive Lifecycle):**
   - Switch back to Portfolio Manager. Click **Archive**. The portfolio remains accessible in the directory under the "Archived" tab with complete historical integrity intact.

---

## 9. Next Steps (Phase 2 & 3)

Per project instructions, subsequent modules are strictly gated behind explicit user approval:
- **Phase 2:** Financial Transactions and Milestone Tracking.
- **Phase 3:** Analytics and Basic Risk Assessment.
