import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { config } from '../config';

beforeAll(() => {
  config.database.url = '';
});

describe('SEPMS Backend API — Phase 2 Transactions & Milestones Test Suite', () => {
  const PM_TOKEN = 'Bearer test-pm-token';
  const DEV_TOKEN = 'Bearer test-dev-token';
  const EXEC_TOKEN = 'Bearer test-exec-token';
  const ADMIN_TOKEN = 'Bearer test-admin-token';

  const PORTFOLIO_ID = '11111111-1111-1111-1111-111111111111'; // Owner: PM (0000...0001), Currency: USD
  const ARCHIVED_PORTFOLIO_ID = '33333333-3333-3333-3333-333333333333';

  // ----------------------------------------------------------------------------
  // 1. Transaction Read Access
  // ----------------------------------------------------------------------------
  it('1. Rejects unauthenticated request to /api/v1/portfolios/:id/transactions with 401', async () => {
    const res = await request(app).get(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. Universal Read Access: Developers, Executives, and PMs can list transactions', async () => {
    const devRes = await request(app)
      .get(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions`)
      .set('Authorization', DEV_TOKEN);
    expect(devRes.status).toBe(200);
    expect(devRes.body.success).toBe(true);
    expect(Array.isArray(devRes.body.data)).toBe(true);
    expect(devRes.body.data.length).toBeGreaterThan(0);

    const execRes = await request(app)
      .get(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions`)
      .set('Authorization', EXEC_TOKEN);
    expect(execRes.status).toBe(200);

    const pmRes = await request(app)
      .get(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions`)
      .set('Authorization', PM_TOKEN);
    expect(pmRes.status).toBe(200);
  });

  // ----------------------------------------------------------------------------
  // 2. Transaction Creation & RBAC
  // ----------------------------------------------------------------------------
  it('3. Prevents Developers from recording expenses (RBAC 403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions`)
      .set('Authorization', DEV_TOKEN)
      .send({
        amount: 5000,
        currency: 'USD',
        category: 'INFRASTRUCTURE',
        transactionDate: '2026-04-01',
        description: 'Unauthorized Dev Cloud Spend'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('4. Allows Portfolio Owner to record an expense transaction', async () => {
    const res = await request(app)
      .post(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions`)
      .set('Authorization', PM_TOKEN)
      .send({
        amount: 15000,
        currency: 'USD',
        category: 'SOFTWARE_LICENSING',
        transactionDate: '2026-04-10',
        description: 'GitHub Enterprise annual seat licenses',
        justification: 'Approved developer productivity tooling'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe('15000.00');
    expect(res.body.data.category).toBe('SOFTWARE_LICENSING');
    expect(res.body.data.transaction_type).toBe('EXPENSE');
    expect(res.body.data.is_reversed).toBe(false);
  });

  it('5. Rejects expense creation if transaction currency does not match portfolio currency', async () => {
    const res = await request(app)
      .post(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions`)
      .set('Authorization', PM_TOKEN)
      .send({
        amount: 8000,
        currency: 'EUR', // Portfolio is USD
        category: 'VENDOR',
        transactionDate: '2026-04-12',
        description: 'European vendor consulting invoice'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CURRENCY_MISMATCH');
  });

  it('6. Rejects expense creation on an archived portfolio', async () => {
    const res = await request(app)
      .post(`/api/v1/portfolios/${ARCHIVED_PORTFOLIO_ID}/transactions`)
      .set('Authorization', PM_TOKEN)
      .send({
        amount: 3000,
        currency: 'USD',
        category: 'INFRASTRUCTURE',
        transactionDate: '2026-04-15',
        description: 'Post-archive patch attempt'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PORTFOLIO_ARCHIVED');
  });

  // ----------------------------------------------------------------------------
  // 3. Reversals & Immutability
  // ----------------------------------------------------------------------------
  it('7. Strictly prohibits hard deletion (DELETE) on transactions with 405 Method Not Allowed', async () => {
    const res = await request(app)
      .delete(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions/tx-001`)
      .set('Authorization', ADMIN_TOKEN);

    expect(res.status).toBe(405);
    expect(res.body.error.code).toBe('TRANSACTION_DELETION_PROHIBITED');
  });

  it('8. Allows Portfolio Owner to reverse an expense with justification', async () => {
    // Reverse tx-003
    const res = await request(app)
      .post(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions/tx-003/reverse`)
      .set('Authorization', PM_TOKEN)
      .send({
        justification: 'Vendor agreed to annual discount credit and re-invoiced under lower SKU'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction_type).toBe('REVERSAL');
    expect(res.body.data.reversed_transaction_id).toBe('tx-003');
    expect(res.body.data.amount).toBe('12000.00');
  });

  it('9. Prevents double-reversal of an already-reversed transaction (409 Conflict)', async () => {
    // tx-004 is already reversed by tx-005 in mock seed
    const res = await request(app)
      .post(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions/tx-004/reverse`)
      .set('Authorization', PM_TOKEN)
      .send({
        justification: 'Attempting duplicate reversal'
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_REVERSED');
  });

  it('10. Prevents reversing a reversal transaction itself (400 Bad Request)', async () => {
    // tx-005 is a REVERSAL
    const res = await request(app)
      .post(`/api/v1/portfolios/${PORTFOLIO_ID}/transactions/tx-005/reverse`)
      .set('Authorization', PM_TOKEN)
      .send({
        justification: 'Attempting to reverse a reversal'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REVERSAL_TARGET');
  });

  // ----------------------------------------------------------------------------
  // 4. Global Ledger
  // ----------------------------------------------------------------------------
  it('11. Allows authenticated users to query the global transactions ledger with filters', async () => {
    const res = await request(app)
      .get('/api/v1/transactions?category=INFRASTRUCTURE')
      .set('Authorization', DEV_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((t: any) => t.category === 'INFRASTRUCTURE')).toBe(true);
  });

  // ----------------------------------------------------------------------------
  // 5. Milestones Lifecycle & Overdue Detection
  // ----------------------------------------------------------------------------
  it('12. Universal Read Access: Any authenticated user can list portfolio milestones with overdue indicators', async () => {
    const res = await request(app)
      .get(`/api/v1/portfolios/${PORTFOLIO_ID}/milestones`)
      .set('Authorization', EXEC_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    // ms-004 is target_date 2026-02-28, status PENDING -> should be is_overdue: true
    const overdueMs = res.body.data.find((m: any) => m.id === 'ms-004');
    expect(overdueMs).toBeDefined();
    expect(overdueMs.is_overdue).toBe(true);
  });

  it('13. Prevents Developers from creating milestones (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/v1/portfolios/${PORTFOLIO_ID}/milestones`)
      .set('Authorization', DEV_TOKEN)
      .send({
        name: 'Unauthorized Milestone',
        targetDate: '2026-07-01'
      });

    expect(res.status).toBe(403);
  });

  it('14. Allows Portfolio Owner to create a new milestone', async () => {
    const res = await request(app)
      .post(`/api/v1/portfolios/${PORTFOLIO_ID}/milestones`)
      .set('Authorization', PM_TOKEN)
      .send({
        name: 'Load Testing & Chaos Engineering Suite Complete',
        targetDate: '2026-08-30',
        status: 'PENDING',
        notes: 'Targeting 50k requests/sec throughput'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Load Testing & Chaos Engineering Suite Complete');
    expect(res.body.data.status).toBe('PENDING');
  });

  it('15. Allows Owner to update milestone to COMPLETED (auto-populates actual_date)', async () => {
    const res = await request(app)
      .patch(`/api/v1/portfolios/${PORTFOLIO_ID}/milestones/ms-003`)
      .set('Authorization', PM_TOKEN)
      .send({
        status: 'COMPLETED',
        notes: 'Successfully cut over traffic ahead of schedule'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.actual_date).toBeTruthy();
    expect(res.body.data.is_overdue).toBe(false);
  });

  it('16. Strictly prohibits hard deletion (DELETE) on milestones with 405 Method Not Allowed', async () => {
    const res = await request(app)
      .delete(`/api/v1/portfolios/${PORTFOLIO_ID}/milestones/ms-001`)
      .set('Authorization', ADMIN_TOKEN);

    expect(res.status).toBe(405);
    expect(res.body.error.code).toBe('MILESTONE_DELETION_PROHIBITED');
  });

  // ----------------------------------------------------------------------------
  // 6. Dynamically Calculated Portfolio Summary
  // ----------------------------------------------------------------------------
  it('17. Returns dynamic budget consumption, net spending, and milestone statistics on GET /api/v1/portfolios/:id/summary', async () => {
    const res = await request(app)
      .get(`/api/v1/portfolios/${PORTFOLIO_ID}/summary`)
      .set('Authorization', DEV_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currency).toBe('USD');
    expect(res.body.data.targetBudget).toBe(750000);
    expect(typeof res.body.data.netSpending).toBe('number');
    expect(typeof res.body.data.remainingBudget).toBe('number');
    expect(res.body.data.remainingBudget).toBe(res.body.data.targetBudget - res.body.data.netSpending);
    expect(res.body.data.milestoneStats.total).toBeGreaterThan(0);
  });
});
