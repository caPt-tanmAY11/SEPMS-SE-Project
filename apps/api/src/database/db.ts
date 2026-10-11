import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';

let pool: Pool | null = null;
let isMockDb = false;

// In-memory tables for offline testing when no live DATABASE_URL is configured
export interface MockState {
  userProfiles: any[];
  portfolios: any[];
  portfolioMemberships: any[];
  seAssets: any[];
  auditLogs: any[];
}

export const mockState: MockState = {
  userProfiles: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'pm@sepms.local',
      full_name: 'Alex Vance (Portfolio Manager)',
      department: 'Software Engineering PMO',
      employee_id: 'EMP-1001',
      role: 'PORTFOLIO_MANAGER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'dev@sepms.local',
      full_name: 'Devon Lee (Senior Developer)',
      department: 'Core Platform Engineering',
      employee_id: 'EMP-1002',
      role: 'DEVELOPER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'exec@sepms.local',
      full_name: 'Elena Rostova (VP of Engineering)',
      department: 'Executive Leadership',
      employee_id: 'EMP-1003',
      role: 'EXECUTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'admin@sepms.local',
      full_name: 'Sam Altman (System Administrator)',
      department: 'IT Operations',
      employee_id: 'EMP-1004',
      role: 'ADMIN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  portfolios: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'NextGen Core Cloud Platform',
      description: 'Microservices transformation and cloud-native Kubernetes infrastructure migration.',
      target_budget: '750000.00',
      currency: 'USD',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'ACTIVE',
      version: 1,
      created_by: '00000000-0000-0000-0000-000000000001',
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
      updated_at: new Date('2026-01-01T09:00:00Z').toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Mobile SDK 3.0 Refactor',
      description: 'High-performance cross-platform biometric auth & offline synchronization framework.',
      target_budget: '320000.00',
      currency: 'EUR',
      start_date: '2026-02-15',
      end_date: '2026-08-30',
      status: 'ACTIVE',
      version: 1,
      created_by: '00000000-0000-0000-0000-000000000001',
      created_at: new Date('2026-02-15T10:00:00Z').toISOString(),
      updated_at: new Date('2026-02-15T10:00:00Z').toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Legacy Monolith Maintenance',
      description: 'Security patch maintenance and compliance auditing for archived monolith services.',
      target_budget: '150000.00',
      currency: 'USD',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      status: 'ARCHIVED',
      version: 1,
      created_by: '00000000-0000-0000-0000-000000000001',
      created_at: new Date('2025-01-01T08:00:00Z').toISOString(),
      updated_at: new Date('2025-12-31T18:00:00Z').toISOString()
    }
  ],
  portfolioMemberships: [
    {
      id: 'm1',
      portfolio_id: '11111111-1111-1111-1111-111111111111',
      user_id: '00000000-0000-0000-0000-000000000001',
      role: 'OWNER',
      assigned_at: new Date('2026-01-01T09:00:00Z').toISOString()
    },
    {
      id: 'm2',
      portfolio_id: '11111111-1111-1111-1111-111111111111',
      user_id: '00000000-0000-0000-0000-000000000002',
      role: 'CONTRIBUTOR',
      assigned_at: new Date('2026-01-02T10:00:00Z').toISOString()
    },
    {
      id: 'm3',
      portfolio_id: '22222222-2222-2222-2222-222222222222',
      user_id: '00000000-0000-0000-0000-000000000001',
      role: 'OWNER',
      assigned_at: new Date('2026-02-15T10:00:00Z').toISOString()
    },
    {
      id: 'm4',
      portfolio_id: '33333333-3333-3333-3333-333333333333',
      user_id: '00000000-0000-0000-0000-000000000001',
      role: 'OWNER',
      assigned_at: new Date('2025-01-01T08:00:00Z').toISOString()
    }
  ],
  seAssets: [
    {
      id: 'a1',
      portfolio_id: '11111111-1111-1111-1111-111111111111',
      name: 'github.com/org/core-services',
      type: 'REPOSITORY',
      url: 'https://github.com/org/core-services',
      external_id: 'REPO-101',
      metadata: {},
      created_at: new Date('2026-01-01T09:00:00Z').toISOString()
    }
  ],
  auditLogs: []
};

export function initDbPool(): Pool | null {
  if (pool) return pool;

  if (config.database.url) {
    try {
      pool = new Pool({
        connectionString: config.database.url,
        ssl: {
          rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });
      isMockDb = false;
      console.log('[Database] Connected to PostgreSQL via pg.Pool');
      return pool;
    } catch (err) {
      console.warn('[Database] Failed to initialize pg.Pool with provided DATABASE_URL. Falling back to test mock adapter.', err);
      isMockDb = true;
      return null;
    }
  } else {
    isMockDb = true;
    console.log('[Database] No live DATABASE_URL provided. Running in offline test mock mode.');
    return null;
  }
}

export function isUsingMockDb(): boolean {
  return isMockDb || !config.database.url;
}

export async function query<T extends QueryResultRow = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  if (config.database.url && pool) {
    return pool.query<T>(sql, params);
  }

  // Robust mock executor for development/unit testing without live Supabase credentials
  return executeMockSql(sql, params) as unknown as QueryResult<T>;
}

function executeMockSql(sql: string, params: any[] = []): QueryResult<any> {
  const normalized = sql.trim().toUpperCase();

  // 1. SELECT from user_profiles by id
  if (normalized.includes('FROM PUBLIC.USER_PROFILES') || normalized.includes('FROM USER_PROFILES')) {
    if (normalized.includes('WHERE ID = $1')) {
      const user = mockState.userProfiles.find((u) => u.id === params[0]);
      return {
        rows: user ? [user] : [],
        rowCount: user ? 1 : 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      };
    }
    if (normalized.includes('WHERE EMAIL = $1')) {
      const user = mockState.userProfiles.find((u) => u.email === params[0]);
      return {
        rows: user ? [user] : [],
        rowCount: user ? 1 : 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      };
    }
    // List users
    return {
      rows: [...mockState.userProfiles],
      rowCount: mockState.userProfiles.length,
      command: 'SELECT',
      oid: 0,
      fields: []
    };
  }

  // 2. SELECT counts / stats for dashboard
  if (normalized.includes('COUNT(*)') && normalized.includes('PORTFOLIOS')) {
    const total = mockState.portfolios.length;
    const active = mockState.portfolios.filter((p) => p.status === 'ACTIVE').length;
    const archived = mockState.portfolios.filter((p) => p.status === 'ARCHIVED').length;
    return {
      rows: [{ total, active, archived }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    };
  }

  // 3. Check membership / ownership
  if (normalized.includes('FROM PUBLIC.PORTFOLIO_MEMBERSHIPS') || normalized.includes('FROM PORTFOLIO_MEMBERSHIPS')) {
    if (normalized.includes('PORTFOLIO_ID = $1') && normalized.includes('USER_ID = $2')) {
      const portfolioId = params[0];
      const userId = params[1];
      let matches = mockState.portfolioMemberships.filter(
        (m) => m.portfolio_id === portfolioId && m.user_id === userId
      );
      if (normalized.includes("ROLE = 'OWNER'")) {
        matches = matches.filter((m) => m.role === 'OWNER');
      }
      return {
        rows: matches,
        rowCount: matches.length,
        command: 'SELECT',
        oid: 0,
        fields: []
      };
    }

    if (normalized.includes('PORTFOLIO_ID = $1')) {
      const portfolioId = params[0];
      const members = mockState.portfolioMemberships
        .filter((m) => m.portfolio_id === portfolioId)
        .map((m) => {
          const profile = mockState.userProfiles.find((u) => u.id === m.user_id);
          return {
            ...m,
            email: profile?.email || '',
            full_name: profile?.full_name || '',
            department: profile?.department || '',
            employee_id: profile?.employee_id || ''
          };
        });
      return {
        rows: members,
        rowCount: members.length,
        command: 'SELECT',
        oid: 0,
        fields: []
      };
    }
  }

  // 4. SELECT portfolio by ID
  if ((normalized.includes('FROM PUBLIC.PORTFOLIOS') || normalized.includes('FROM PORTFOLIOS')) && (normalized.includes('WHERE P.ID = $1') || normalized.includes('WHERE ID = $1'))) {
    const id = params[0];
    const portfolio = mockState.portfolios.find((p) => p.id === id);
    if (!portfolio) {
      return { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
    }
    const creator = mockState.userProfiles.find((u) => u.id === portfolio.created_by);
    const ownerMembership = mockState.portfolioMemberships.find(
      (m) => m.portfolio_id === portfolio.id && m.role === 'OWNER'
    );
    const owner = ownerMembership
      ? mockState.userProfiles.find((u) => u.id === ownerMembership.user_id)
      : creator;

    const row = {
      ...portfolio,
      owner_name: owner?.full_name || creator?.full_name || 'Unassigned',
      owner_email: owner?.email || creator?.email || '',
      owner_id: owner?.id || creator?.id || ''
    };
    return {
      rows: [row],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: []
    };
  }

  // 5. SELECT all portfolios with optional filters
  if (normalized.includes('FROM PUBLIC.PORTFOLIOS') || normalized.includes('FROM PORTFOLIOS')) {
    let result = mockState.portfolios.map((portfolio) => {
      const creator = mockState.userProfiles.find((u) => u.id === portfolio.created_by);
      const ownerMembership = mockState.portfolioMemberships.find(
        (m) => m.portfolio_id === portfolio.id && m.role === 'OWNER'
      );
      const owner = ownerMembership
        ? mockState.userProfiles.find((u) => u.id === ownerMembership.user_id)
        : creator;

      return {
        ...portfolio,
        owner_name: owner?.full_name || creator?.full_name || 'Unassigned',
        owner_email: owner?.email || creator?.email || '',
        owner_id: owner?.id || creator?.id || ''
      };
    });

    // Check status filter parameter if present
    if (params.length > 0 && (params[0] === 'ACTIVE' || params[0] === 'ARCHIVED')) {
      result = result.filter((p) => p.status === params[0]);
    }

    return {
      rows: result,
      rowCount: result.length,
      command: 'SELECT',
      oid: 0,
      fields: []
    };
  }

  // 6. INSERT portfolio
  if (normalized.startsWith('INSERT INTO PUBLIC.PORTFOLIOS') || normalized.startsWith('INSERT INTO PORTFOLIOS')) {
    const [name, description, target_budget, currency, start_date, end_date, created_by] = params;
    const crypto = require('crypto');
    const newPortfolio = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      target_budget: String(target_budget),
      currency,
      start_date,
      end_date,
      status: 'ACTIVE',
      version: 1,
      created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockState.portfolios.unshift(newPortfolio);
    return {
      rows: [newPortfolio],
      rowCount: 1,
      command: 'INSERT',
      oid: 0,
      fields: []
    };
  }

  // 7. INSERT membership
  if (normalized.startsWith('INSERT INTO PUBLIC.PORTFOLIO_MEMBERSHIPS') || normalized.startsWith('INSERT INTO PORTFOLIO_MEMBERSHIPS')) {
    const portfolio_id = params[0];
    const user_id = params[1];
    const role = params[2] || (normalized.includes("'OWNER'") ? 'OWNER' : 'CONTRIBUTOR');
    const crypto = require('crypto');
    const newMembership = {
      id: crypto.randomUUID(),
      portfolio_id,
      user_id,
      role,
      assigned_at: new Date().toISOString()
    };
    mockState.portfolioMemberships.push(newMembership);
    return {
      rows: [newMembership],
      rowCount: 1,
      command: 'INSERT',
      oid: 0,
      fields: []
    };
  }

  // 8. UPDATE portfolio with optimistic concurrency check
  if (normalized.startsWith('UPDATE PUBLIC.PORTFOLIOS') || normalized.startsWith('UPDATE PORTFOLIOS')) {
    // Archiving: UPDATE public.portfolios SET status = 'ARCHIVED' WHERE id = $1
    if (normalized.includes('STATUS =') && normalized.includes('ARCHIVED')) {
      const id = params[params.length - 1];
      const portfolio = mockState.portfolios.find((p) => p.id === id);
      if (portfolio) {
        portfolio.status = 'ARCHIVED';
        portfolio.updated_at = new Date().toISOString();
        return {
          rows: [portfolio],
          rowCount: 1,
          command: 'UPDATE',
          oid: 0,
          fields: []
        };
      }
      return { rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] };
    }

    const [name, description, target_budget, currency, start_date, end_date, id, expectedVersion] = params;
    const portfolio = mockState.portfolios.find((p) => p.id === id);
    if (!portfolio) {
      return { rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] };
    }
    if (portfolio.version !== expectedVersion) {
      // Optimistic concurrency failure: 0 rows updated
      return { rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] };
    }

    portfolio.name = name;
    portfolio.description = description;
    portfolio.target_budget = String(target_budget);
    portfolio.currency = currency;
    portfolio.start_date = start_date;
    portfolio.end_date = end_date;
    portfolio.version += 1;
    portfolio.updated_at = new Date().toISOString();

    return {
      rows: [portfolio],
      rowCount: 1,
      command: 'UPDATE',
      oid: 0,
      fields: []
    };
  }

  // 9. INSERT audit log
  if (normalized.startsWith('INSERT INTO PUBLIC.AUDIT_LOGS') || normalized.startsWith('INSERT INTO AUDIT_LOGS')) {
    const crypto = require('crypto');
    const log = {
      id: crypto.randomUUID(),
      entity_type: params[0],
      entity_id: params[1],
      action: params[2],
      actor_id: params[3],
      changes: params[4],
      ip_address: params[5],
      created_at: new Date().toISOString()
    };
    mockState.auditLogs.push(log);
    return { rows: [log], rowCount: 1, command: 'INSERT', oid: 0, fields: [] };
  }

  // Default empty result
  return { rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] };
}
