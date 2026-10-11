# Software Engineering Portfolio Management System (SEPMS)

> **College Lab Project — Software Engineering (SE)**  
> **Prepared by:** Tanmay Vishwakarma & Devraj Sundrani  
> **Institution:** Sardar Patel Institute of Technology  
> **Phase Status:** Phase 1 Complete (Awaiting User Approval for Phase 2)

---

## 1. Project Overview

The **Software Engineering Portfolio Management System (SEPMS)** is an enterprise web application designed to manage, track, and monitor software engineering initiatives, technical assets, project budgets, and delivery health.

A portfolio represents a software project, maintenance initiative, or collection of engineering assets. SEPMS provides organizational visibility into project delivery without personal investment or financial market abstractions.

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

## 3. Demo Persona Accounts & Credentials

For lab presentations, evaluation, and testing, the system comes with 4 predefined role personas:

> **Default Password for All Demo Accounts:**  
> **`Password123!`**

| Persona Name | Email | Role | Department | Description & Permissions |
|---|---|---|---|---|
| **Alex Vance** | `pm@sepms.local` | `PORTFOLIO_MANAGER` | Software Engineering PMO | Full CRUD on portfolios, assigns team members, can edit/archive owned portfolios. |
| **Devon Lee** | `dev@sepms.local` | `DEVELOPER` | Core Platform Engineering | Read-only viewer across all portfolios, timelines, and SE assets. |
| **Elena Rostova** | `exec@sepms.local` | `EXECUTIVE` | Executive Leadership | Read-only oversight across organizational budgets, KPIs, and governance. |
| **Sam Altman** | `admin@sepms.local` | `ADMIN` | IT Operations | System administrator with global maintenance and override privileges. |

---

## 4. Architecture & Repository Structure

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
│           ├── config/         # Environment configuration (.env loader)
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
│   └── seed.sql                # Reference seed documentation
├── scripts/
│   ├── seed_demo_data.ts       # Seeds 4 portfolios, demo users, memberships, and assets
│   └── provision_demo_users.ts # Server-side demo account provisioning script
├── docker-compose.yml          # Optional local PostgreSQL service
└── package.json                # npm workspaces root configuration
```

---

## 5. Quickstart & Running the Project

### Prerequisites
- **Node.js:** v18+ (tested on Node v20/v22/v24)
- **npm:** v9+

---

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/caPt-tanmAY11/SEPMS-SE-Project.git
cd SEPMS-SE-Project
npm install
```

---

### Step 2: Configure Environment Variables

Create your `.env` file in the project root:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase configuration:

```dotenv
# Frontend (Client)
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_BASE_URL=http://localhost:3001/api/v1

# Backend (Server)
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>

# Database Connection URI (Use the IPv4 Connection Pooler URI)
# In Supabase: Project Settings -> Database -> Connection String -> URI -> Method: Session (port 5432) or Transaction (port 6543)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

> **Note on Database Connection:**  
> Direct connections (`db.<ref>.supabase.co:5432`) use IPv6. If your network does not support IPv6, direct connections will fail with `ENETUNREACH`. Always use the **IPv4 Connection Pooler URL** (`aws-0-[region].pooler.supabase.com`) provided in your Supabase Dashboard under Database Settings.
>
> *(If `DATABASE_URL` is omitted, the API automatically falls back to an in-memory mock adapter for instant offline testing).*

---

### Step 3: Initialize Database Schema (One-Time Setup)

In your Supabase project dashboard:
1. Go to **SQL Editor**.
2. Open and copy the SQL migration file: [`supabase/migrations/20261011000001_phase1_init.sql`](supabase/migrations/20261011000001_phase1_init.sql).
3. Paste and click **Run**.  
   *All 5 tables, triggers, indexes, and 11 Row Level Security (RLS) policies will be created.*

---

### Step 4: Seed Dummy Data

To populate the database with the 4 demo personas, sample portfolios, team memberships, and software assets, run:

```bash
npx ts-node scripts/seed_demo_data.ts
```

This creates:
- 4 persona users with credentials (`pm@sepms.local`, etc.)
- 4 rich engineering portfolios (Cloud Migration, AI Dev Tooling, Zero-Trust Security, Monolith Decomposition)
- Contributor memberships and linked GitHub/Jira/Docs assets

---

### Step 5: Start the Application

You can start both services concurrently or individually:

#### Option A: Start Both Frontend and Backend Concurrently
```bash
npm run dev
```

#### Option B: Start in Separate Terminals (Recommended for Development)

**Terminal 1 (Backend API):**
```bash
npm run dev:api
```
*Output confirmation:*
```text
[Database] Connected to PostgreSQL via pg.Pool
====================================================
🚀 SEPMS Backend API running on http://localhost:3001
📡 Environment: development
🗄️ Database: PostgreSQL (live)
====================================================
```

**Terminal 2 (Web Frontend):**
```bash
npm run dev:web
```
*Output confirmation:*
```text
VITE v5.4.14 ready in 180 ms
➜ Local: http://localhost:5173/
```

Open **`http://localhost:5173`** in your browser.

---

## 6. Verification & Automated Testing

### Run Integration Tests
```bash
npm run test
```
Runs 13 end-to-end API integration tests verifying:
- Authentication & Bearer token verification
- Universal Read Access (BR-01) across all roles
- Portfolio creation and ownership assignment
- Role-based authorization rejection (403 Forbidden)
- **Optimistic Concurrency Control (OCC):** Rejection on stale version updates (409 Conflict)
- **Non-destructive lifecycle:** Safe archiving and prohibition of hard deletions (405 Method Not Allowed)
- Zod schema validation for budgets, currencies, and dates

### Run Build & Lint Verification
```bash
npm run lint
npm run build
```

---

## 7. College Lab Evaluation & Demo Guide

Follow these steps for a live presentation of Phase 1 requirements:

1. **Sign In / Persona Switcher:**
   - Navigate to `http://localhost:5173/login`.
   - Click the **Portfolio Manager** card (`pm@sepms.local` / `Password123!`).
2. **Dashboard Overview:**
   - View organizational metrics: Total Portfolios, Active Initiatives, and Archived Projects.
3. **Universal Read Access:**
   - Click **Portfolios** in the sidebar. All portfolios across all teams are transparently visible.
4. **Create a Portfolio:**
   - Click **Create Portfolio**. Fill name, budget, start and end dates. Add contributors.
   - Click **Create Portfolio**. The creator is automatically bound as Owner.
5. **Optimistic Concurrency Control:**
   - Open any portfolio detail view. Click **Edit Portfolio**.
   - Notice the version token tracking. Concurrent outdated submissions are rejected with 409 Conflict.
6. **Role Enforcement (RBAC):**
   - In the sidebar footer, click **Switch Persona** and select **Software Developer** (`dev@sepms.local`).
   - Notice the "Edit Portfolio" button dynamically switches to a disabled **Read-Only Viewer** badge. Attempting mutations via API returns 403 Forbidden.
7. **Non-Destructive Archiving:**
   - Switch back to **Portfolio Manager**. Click **Archive Portfolio**.
   - The portfolio transitions to `ARCHIVED` status. It remains accessible in the directory under the **Archived** tab with its complete audit history preserved.

---

## 8. Next Phases Roadmap

Subsequent modules are strictly gated behind project milestones:
- **Phase 2:** Financial Transactions (cloud, vendor, labor expenses) and Milestone Delivery Tracking.
- **Phase 3:** Analytics, Budget Burn-Down Velocity, and Early Risk Overrun Detection (>10% budget variance, schedule slippage).
