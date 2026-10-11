import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('--- Seeding Database with Dummy Data ---');

  const users = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'pm@sepms.local',
      fullName: 'Alex Vance (Portfolio Manager)',
      role: 'PORTFOLIO_MANAGER',
      department: 'Software Engineering PMO',
      empId: 'EMP-1001'
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      email: 'dev@sepms.local',
      fullName: 'Devon Lee (Senior Developer)',
      role: 'DEVELOPER',
      department: 'Core Platform Engineering',
      empId: 'EMP-1002'
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      email: 'exec@sepms.local',
      fullName: 'Elena Rostova (VP of Engineering)',
      role: 'EXECUTIVE',
      department: 'Executive Leadership',
      empId: 'EMP-1003'
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      email: 'admin@sepms.local',
      fullName: 'Sam Altman (System Administrator)',
      role: 'ADMIN',
      department: 'IT Operations',
      empId: 'EMP-1004'
    }
  ];

  // 1. User Profiles
  for (const u of users) {
    await pool.query(
      `INSERT INTO auth.users (id, aud, role, email, email_confirmed_at)
       VALUES ($1, 'authenticated', 'authenticated', $2, NOW())
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [u.id, u.email]
    );

    await pool.query(
      `INSERT INTO public.user_profiles (id, email, full_name, department, employee_id, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         department = EXCLUDED.department,
         employee_id = EXCLUDED.employee_id`,
      [u.id, u.email, u.fullName, u.department, u.empId, u.role]
    );
  }
  console.log('✅ Demo user profiles seeded');

  // 2. Portfolios
  const portfolios = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Cloud Infrastructure Modernization',
      description: 'Strategic migration of core microservices to Kubernetes with automated GitOps pipelines and zero-downtime deployment.',
      targetBudget: '450000.00',
      currency: 'USD',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'ACTIVE',
      createdBy: 'a0000000-0000-0000-0000-000000000001'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'NextGen AI Developer Tooling & Copilot',
      description: 'Internal developer platform empowering 500+ engineers with AI-assisted code review, auto-generated unit tests, and continuous architectural compliance.',
      targetBudget: '320000.00',
      currency: 'USD',
      startDate: '2026-02-15',
      endDate: '2026-11-30',
      status: 'ACTIVE',
      createdBy: 'a0000000-0000-0000-0000-000000000001'
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Legacy Monolith Decomposition (Phase A)',
      description: 'Completed migration decoupling billing and user authentication services from the legacy Rails application into scalable Go services.',
      targetBudget: '180000.00',
      currency: 'USD',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'ARCHIVED',
      createdBy: 'a0000000-0000-0000-0000-000000000001'
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Enterprise Zero-Trust Security Architecture',
      description: 'Implementation of mTLS, centralized IAM service mesh, secret rotation, and SOC2 automated compliance monitoring across all corporate engineering environments.',
      targetBudget: '600000.00',
      currency: 'USD',
      startDate: '2026-03-01',
      endDate: '2027-02-28',
      status: 'ACTIVE',
      createdBy: 'a0000000-0000-0000-0000-000000000001'
    }
  ];

  for (const p of portfolios) {
    await pool.query(
      `INSERT INTO public.portfolios (id, name, description, target_budget, currency, start_date, end_date, status, version, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         target_budget = EXCLUDED.target_budget,
         currency = EXCLUDED.currency,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         status = EXCLUDED.status`,
      [p.id, p.name, p.description, p.targetBudget, p.currency, p.startDate, p.endDate, p.status, p.createdBy]
    );
  }
  console.log('✅ 4 Portfolios seeded');

  // 3. Memberships
  const memberships = [
    { pId: '11111111-1111-1111-1111-111111111111', uId: 'a0000000-0000-0000-0000-000000000001', role: 'OWNER' },
    { pId: '11111111-1111-1111-1111-111111111111', uId: 'a0000000-0000-0000-0000-000000000002', role: 'CONTRIBUTOR' },
    { pId: '22222222-2222-2222-2222-222222222222', uId: 'a0000000-0000-0000-0000-000000000001', role: 'OWNER' },
    { pId: '22222222-2222-2222-2222-222222222222', uId: 'a0000000-0000-0000-0000-000000000002', role: 'CONTRIBUTOR' },
    { pId: '33333333-3333-3333-3333-333333333333', uId: 'a0000000-0000-0000-0000-000000000001', role: 'OWNER' },
    { pId: '44444444-4444-4444-4444-444444444444', uId: 'a0000000-0000-0000-0000-000000000001', role: 'OWNER' },
    { pId: '44444444-4444-4444-4444-444444444444', uId: 'a0000000-0000-0000-0000-000000000002', role: 'CONTRIBUTOR' }
  ];

  for (const m of memberships) {
    await pool.query(
      `INSERT INTO public.portfolio_memberships (portfolio_id, user_id, role, assigned_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (portfolio_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [m.pId, m.uId, m.role]
    );
  }
  console.log('✅ Portfolio memberships assigned');

  // 4. SE Assets
  const assets = [
    {
      pId: '11111111-1111-1111-1111-111111111111',
      name: 'github.com/org/core-infra-k8s',
      type: 'REPOSITORY',
      url: 'https://github.com/org/core-infra-k8s',
      extId: 'REPO-K8S-101'
    },
    {
      pId: '11111111-1111-1111-1111-111111111111',
      name: 'Cloud Migration Architecture Specification',
      type: 'DOCUMENTATION',
      url: 'https://docs.sepms.local/arch/cloud-v2',
      extId: 'DOC-ARCH-01'
    },
    {
      pId: '22222222-2222-2222-2222-222222222222',
      name: 'github.com/org/ai-developer-agent',
      type: 'REPOSITORY',
      url: 'https://github.com/org/ai-developer-agent',
      extId: 'REPO-AI-202'
    },
    {
      pId: '44444444-4444-4444-4444-444444444444',
      name: 'Jira Epic: SEC-ZT-2026',
      type: 'BOARD_EPIC',
      url: 'https://jira.sepms.local/browse/SEC-ZT-2026',
      extId: 'SEC-ZT-2026'
    }
  ];

  for (const a of assets) {
    await pool.query(
      `INSERT INTO public.se_assets (portfolio_id, name, type, url, external_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, '{}', NOW())`,
      [a.pId, a.name, a.type, a.url, a.extId]
    );
  }
  console.log('✅ SE Assets seeded');

  // 5. Audit Logs
  for (const p of portfolios) {
    await pool.query(
      `INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, changes, ip_address, created_at)
       VALUES ('PORTFOLIO', $1, 'PORTFOLIO_CREATED', $2, json_build_object('name', $3::text, 'status', $4::text), '127.0.0.1', NOW())`,
      [p.id, p.createdBy, p.name, p.status]
    );
  }
  console.log('✅ Audit logs seeded');

  await pool.end();
  console.log('--- Seeding Successfully Finished ---');
}

run().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
