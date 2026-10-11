import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { mockState } from '../database/db';

describe('SEPMS Backend API — Phase 1 Test Suite', () => {
  const PM_TOKEN = 'Bearer test-pm-token';
  const DEV_TOKEN = 'Bearer test-dev-token';
  const EXEC_TOKEN = 'Bearer test-exec-token';
  const ADMIN_TOKEN = 'Bearer test-admin-token';

  it('1. Rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/v1/portfolios');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('2. Returns authenticated user profile on GET /api/v1/auth/me', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', PM_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('PORTFOLIO_MANAGER');
    expect(res.body.data.email).toBe('pm@sepms.local');
  });

  it('3. Universal Read Access: Developers, Executives, and PMs can all list portfolios', async () => {
    // Developer
    const devRes = await request(app)
      .get('/api/v1/portfolios')
      .set('Authorization', DEV_TOKEN);
    expect(devRes.status).toBe(200);
    expect(devRes.body.success).toBe(true);
    expect(Array.isArray(devRes.body.data)).toBe(true);

    // Executive
    const execRes = await request(app)
      .get('/api/v1/portfolios')
      .set('Authorization', EXEC_TOKEN);
    expect(execRes.status).toBe(200);
    expect(execRes.body.success).toBe(true);

    // PM
    const pmRes = await request(app)
      .get('/api/v1/portfolios')
      .set('Authorization', PM_TOKEN);
    expect(pmRes.status).toBe(200);
    expect(pmRes.body.success).toBe(true);
  });

  it('4. Allows Portfolio Manager to create a new portfolio and assigns them as Owner', async () => {
    const newPortfolio = {
      name: 'Automated CI/CD Quality Pipeline',
      description: 'Distributed testing and static code analysis orchestration pipeline.',
      targetBudget: 240000,
      currency: 'USD',
      startDate: '2026-04-01',
      endDate: '2026-11-30',
      initialMembers: [
        { userId: '00000000-0000-0000-0000-000000000002', role: 'CONTRIBUTOR' }
      ]
    };

    const res = await request(app)
      .post('/api/v1/portfolios')
      .set('Authorization', PM_TOKEN)
      .send(newPortfolio);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newPortfolio.name);
    expect(res.body.data.owner_id).toBe('00000000-0000-0000-0000-000000000001');
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.version).toBe(1);
    expect(res.body.data.members.some((m: any) => m.role === 'OWNER')).toBe(true);
  });

  it('5. Prevents Developers from creating portfolios (RBAC 403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/portfolios')
      .set('Authorization', DEV_TOKEN)
      .send({
        name: 'Unauthorized Developer Portfolio',
        description: 'Should fail RBAC check',
        targetBudget: 100000,
        currency: 'USD',
        startDate: '2026-05-01',
        endDate: '2026-12-01'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('6. Allows the designated Portfolio Owner to update portfolio metadata', async () => {
    const portfolioId = '11111111-1111-1111-1111-111111111111';
    const updatePayload = {
      name: 'NextGen Core Cloud Platform - V2 Update',
      description: 'Updated scope with multi-cloud failover support.',
      targetBudget: 800000,
      currency: 'USD',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      version: 1
    };

    const res = await request(app)
      .put(`/api/v1/portfolios/${portfolioId}`)
      .set('Authorization', PM_TOKEN)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(updatePayload.name);
    expect(res.body.data.version).toBe(2);
  });

  it('7. Enforces optimistic concurrency control: rejects stale version updates with 409 Conflict', async () => {
    const portfolioId = '11111111-1111-1111-1111-111111111111';
    // Version is now 2 after previous update; submitting version 1 must trigger conflict
    const stalePayload = {
      name: 'Stale Concurrency Update Attempt',
      description: 'This must be rejected by OCC check',
      targetBudget: 999999,
      currency: 'USD',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      version: 1
    };

    const res = await request(app)
      .put(`/api/v1/portfolios/${portfolioId}`)
      .set('Authorization', PM_TOKEN)
      .send(stalePayload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VERSION_CONFLICT');
  });

  it('8. Prevents unauthorized users from updating another owner\'s portfolio', async () => {
    const portfolioId = '11111111-1111-1111-1111-111111111111';
    const res = await request(app)
      .put(`/api/v1/portfolios/${portfolioId}`)
      .set('Authorization', DEV_TOKEN)
      .send({
        name: 'Malicious Update by Contributor',
        description: 'Should be rejected',
        targetBudget: 100000,
        currency: 'USD',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        version: 2
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_PORTFOLIO_OWNER');
  });

  it('9. Allows System Administrator to update any portfolio regardless of ownership', async () => {
    const portfolioId = '22222222-2222-2222-2222-222222222222';
    const res = await request(app)
      .put(`/api/v1/portfolios/${portfolioId}`)
      .set('Authorization', ADMIN_TOKEN)
      .send({
        name: 'Mobile SDK 3.0 (Admin Audited)',
        description: 'Updated by System Administrator.',
        targetBudget: 350000,
        currency: 'EUR',
        startDate: '2026-02-15',
        endDate: '2026-09-15',
        version: 1
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Mobile SDK 3.0 (Admin Audited)');
  });

  it('10. Allows Portfolio Owner to archive portfolio without hard deletion', async () => {
    const portfolioId = '22222222-2222-2222-2222-222222222222';
    const res = await request(app)
      .post(`/api/v1/portfolios/${portfolioId}/archive`)
      .set('Authorization', PM_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ARCHIVED');

    // Verify portfolio still exists and is viewable
    const getRes = await request(app)
      .get(`/api/v1/portfolios/${portfolioId}`)
      .set('Authorization', DEV_TOKEN);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.status).toBe('ARCHIVED');
  });

  it('11. Strictly prohibits hard deletion (DELETE) with 405 Method Not Allowed', async () => {
    const portfolioId = '11111111-1111-1111-1111-111111111111';
    const res = await request(app).delete(`/api/v1/portfolios/${portfolioId}`);

    expect(res.status).toBe(405);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('PORTFOLIO_DELETION_PROHIBITED');
  });

  it('12. Validates request body fields and rejects invalid dates', async () => {
    const res = await request(app)
      .post('/api/v1/portfolios')
      .set('Authorization', PM_TOKEN)
      .send({
        name: 'Invalid Date Portfolio',
        description: 'End date before start date',
        targetBudget: 50000,
        currency: 'USD',
        startDate: '2026-12-01',
        endDate: '2026-01-01' // Invalid!
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('13. Provides dashboard statistics derived from real persisted portfolios', async () => {
    const res = await request(app)
      .get('/api/v1/portfolios/stats')
      .set('Authorization', EXEC_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.totalPortfolios).toBe('number');
    expect(typeof res.body.data.activePortfolios).toBe('number');
    expect(typeof res.body.data.archivedPortfolios).toBe('number');
    expect(Array.isArray(res.body.data.recentPortfolios)).toBe(true);
  });
});
