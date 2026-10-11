import { query } from '../../database/db';
import { CreatePortfolioInput, UpdatePortfolioInput, QueryPortfoliosInput } from './portfolios.validation';
import { AuthenticatedUser } from '../../middleware/auth';

export class PortfolioService {
  /**
   * Retrieves all portfolios with search, filtering, and sorting.
   * Enforces Universal Read Access: visible to every authenticated user.
   */
  static async listPortfolios(filters: QueryPortfoliosInput) {
    let sql = `
      SELECT 
        p.id, p.name, p.description, p.target_budget, p.currency,
        p.start_date, p.end_date, p.status, p.version,
        p.created_by, p.created_at, p.updated_at,
        up.full_name AS owner_name,
        up.email AS owner_email,
        up.id AS owner_id
      FROM public.portfolios p
      LEFT JOIN public.portfolio_memberships pm ON pm.portfolio_id = p.id AND pm.role = 'OWNER'
      LEFT JOIN public.user_profiles up ON up.id = COALESCE(pm.user_id, p.created_by)
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status && filters.status !== 'ALL') {
      sql += ` AND p.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.search && filters.search.trim()) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search.trim()}%`);
      paramIndex++;
    }

    // Sort column validation
    const sortCol = ['name', 'created_at', 'target_budget', 'start_date'].includes(filters.sort)
      ? `p.${filters.sort}`
      : 'p.created_at';
    const sortOrder = filters.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortCol} ${sortOrder}`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Calculates dashboard summary statistics from persisted portfolios
   */
  static async getStats() {
    const statsResult = await query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
        COUNT(*) FILTER (WHERE status = 'ARCHIVED')::int AS archived
      FROM public.portfolios
    `);

    const recentResult = await query(`
      SELECT 
        p.id, p.name, p.target_budget, p.currency, p.status, p.created_at,
        up.full_name AS owner_name
      FROM public.portfolios p
      LEFT JOIN public.portfolio_memberships pm ON pm.portfolio_id = p.id AND pm.role = 'OWNER'
      LEFT JOIN public.user_profiles up ON up.id = COALESCE(pm.user_id, p.created_by)
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    const statsRow = statsResult.rows[0] || { total: 0, active: 0, archived: 0 };
    return {
      totalPortfolios: statsRow.total || 0,
      activePortfolios: statsRow.active || 0,
      archivedPortfolios: statsRow.archived || 0,
      recentPortfolios: recentResult.rows || []
    };
  }

  /**
   * Retrieves single portfolio details with team members and assets
   */
  static async getById(id: string) {
    const portfolioResult = await query(
      `SELECT 
        p.id, p.name, p.description, p.target_budget, p.currency,
        p.start_date, p.end_date, p.status, p.version,
        p.created_by, p.created_at, p.updated_at,
        up.full_name AS owner_name,
        up.email AS owner_email,
        up.id AS owner_id
      FROM public.portfolios p
      LEFT JOIN public.portfolio_memberships pm ON pm.portfolio_id = p.id AND pm.role = 'OWNER'
      LEFT JOIN public.user_profiles up ON up.id = COALESCE(pm.user_id, p.created_by)
      WHERE p.id = $1`,
      [id]
    );

    if (portfolioResult.rows.length === 0) {
      return null;
    }

    const portfolio = portfolioResult.rows[0];

    // Fetch team members
    const membersResult = await query(
      `SELECT 
        pm.id, pm.role, pm.assigned_at,
        up.id AS user_id, up.full_name, up.email, up.department, up.employee_id
      FROM public.portfolio_memberships pm
      JOIN public.user_profiles up ON up.id = pm.user_id
      WHERE pm.portfolio_id = $1
      ORDER BY pm.role ASC, up.full_name ASC`,
      [id]
    );

    // Fetch SE assets
    const assetsResult = await query(
      `SELECT id, name, type, url, external_id, metadata, created_at
       FROM public.se_assets
       WHERE portfolio_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    return {
      ...portfolio,
      members: membersResult.rows,
      assets: assetsResult.rows
    };
  }

  /**
   * Creates a new portfolio, assigning the creator as Portfolio Owner atomically
   */
  static async createPortfolio(input: CreatePortfolioInput, actor: AuthenticatedUser, ipAddress?: string) {
    // 1. Insert portfolio record
    const insertResult = await query(
      `INSERT INTO public.portfolios (
        name, description, target_budget, currency, start_date, end_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        input.name,
        input.description,
        input.targetBudget,
        input.currency,
        input.startDate,
        input.endDate,
        actor.id
      ]
    );

    const portfolio = insertResult.rows[0];

    // 2. Assign creator as Portfolio Owner
    await query(
      `INSERT INTO public.portfolio_memberships (portfolio_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (portfolio_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [portfolio.id, actor.id, 'OWNER']
    );

    // 3. Assign initial contributors if provided
    if (input.initialMembers && input.initialMembers.length > 0) {
      for (const member of input.initialMembers) {
        if (member.userId !== actor.id) {
          await query(
            `INSERT INTO public.portfolio_memberships (portfolio_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (portfolio_id, user_id) DO NOTHING`,
            [portfolio.id, member.userId, 'CONTRIBUTOR']
          );
        }
      }
    }

    // 4. Link SE assets if provided
    if (input.assets && input.assets.length > 0) {
      for (const asset of input.assets) {
        await query(
          `INSERT INTO public.se_assets (portfolio_id, name, type, url, external_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [portfolio.id, asset.name, asset.type, asset.url, asset.externalId || null]
        );
      }
    }

    // 5. Audit log
    await query(
      `INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, changes, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'PORTFOLIO',
        portfolio.id,
        'CREATE',
        actor.id,
        JSON.stringify({ name: portfolio.name, target_budget: portfolio.target_budget }),
        ipAddress || null
      ]
    );

    return this.getById(portfolio.id);
  }

  /**
   * Updates an existing portfolio with optimistic concurrency control
   */
  static async updatePortfolio(id: string, input: UpdatePortfolioInput, actor: AuthenticatedUser, ipAddress?: string) {
    const existingResult = await query('SELECT * FROM public.portfolios WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      const err: any = new Error(`Portfolio with ID '${id}' not found.`);
      err.status = 404;
      err.code = 'PORTFOLIO_NOT_FOUND';
      throw err;
    }

    const currentPortfolio = existingResult.rows[0];

    // Optimistic Concurrency Control Check:
    // If client version differs from current database version, another user updated it
    if (currentPortfolio.version !== input.version) {
      const conflictErr: any = new Error(
        `Optimistic concurrency conflict: This portfolio has been modified by another user (current version: ${currentPortfolio.version}, submitted version: ${input.version}). Please refresh and review latest changes.`
      );
      conflictErr.status = 409;
      conflictErr.code = 'VERSION_CONFLICT';
      throw conflictErr;
    }

    const updateResult = await query(
      `UPDATE public.portfolios
       SET 
         name = $1,
         description = $2,
         target_budget = $3,
         currency = $4,
         start_date = $5,
         end_date = $6,
         version = version + 1
       WHERE id = $7 AND version = $8
       RETURNING *`,
      [
        input.name,
        input.description,
        input.targetBudget,
        input.currency,
        input.startDate,
        input.endDate,
        id,
        input.version
      ]
    );

    if (updateResult.rows.length === 0) {
      const conflictErr: any = new Error('Concurrency conflict occurred during update. Please refresh.');
      conflictErr.status = 409;
      conflictErr.code = 'VERSION_CONFLICT';
      throw conflictErr;
    }

    // Record audit log
    await query(
      `INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, changes, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'PORTFOLIO',
        id,
        'UPDATE',
        actor.id,
        JSON.stringify({ fromVersion: input.version, toVersion: updateResult.rows[0].version }),
        ipAddress || null
      ]
    );

    return this.getById(id);
  }

  /**
   * Archives a portfolio. Preserves all history; strictly prevents hard deletion.
   */
  static async archivePortfolio(id: string, actor: AuthenticatedUser, ipAddress?: string) {
    const existing = await this.getById(id);
    if (!existing) {
      const err: any = new Error(`Portfolio with ID '${id}' not found.`);
      err.status = 404;
      err.code = 'PORTFOLIO_NOT_FOUND';
      throw err;
    }

    const result = await query(
      `UPDATE public.portfolios
       SET status = 'ARCHIVED'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    // Record audit log
    await query(
      `INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, changes, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'PORTFOLIO',
        id,
        'ARCHIVE',
        actor.id,
        JSON.stringify({ previousStatus: existing.status, newStatus: 'ARCHIVED' }),
        ipAddress || null
      ]
    );

    return this.getById(id);
  }

  /**
   * Retrieves dynamically aggregated financial and milestone health summary
   */
  static async getSummary(id: string) {
    const portfolio = await this.getById(id);
    if (!portfolio) {
      const err: any = new Error(`Portfolio with ID '${id}' not found.`);
      err.status = 404;
      err.code = 'PORTFOLIO_NOT_FOUND';
      throw err;
    }

    // 1. Fetch transactions
    const txRes = await query(
      `SELECT amount, transaction_type, is_reversed FROM public.financial_transactions WHERE portfolio_id = $1`,
      [id]
    );

    let totalExpenses = 0;
    let totalReversals = 0;

    for (const tx of txRes.rows) {
      const amt = parseFloat(tx.amount);
      if (tx.transaction_type === 'EXPENSE') {
        totalExpenses += amt;
      } else if (tx.transaction_type === 'REVERSAL') {
        totalReversals += amt;
      }
    }

    const netSpending = Math.max(0, totalExpenses - totalReversals);
    const targetBudget = parseFloat(portfolio.target_budget);
    const remainingBudget = targetBudget - netSpending;
    const utilizationPercentage = targetBudget > 0 ? Number(((netSpending / targetBudget) * 100).toFixed(1)) : 0;

    // 2. Fetch milestones
    const msRes = await query(
      `SELECT status, target_date FROM public.milestones WHERE portfolio_id = $1`,
      [id]
    );

    const today = new Date().toISOString().split('T')[0];
    let completed = 0;
    let pending = 0;
    let missed = 0;
    let overdue = 0;

    for (const ms of msRes.rows) {
      if (ms.status === 'COMPLETED') completed++;
      else if (ms.status === 'MISSED') missed++;
      else if (ms.status === 'PENDING') {
        pending++;
        if (ms.target_date < today) overdue++;
      }
    }

    const totalMilestones = msRes.rows.length;
    const completionRate = totalMilestones > 0 ? Number(((completed / totalMilestones) * 100).toFixed(1)) : 0;

    return {
      portfolioId: id,
      portfolioName: portfolio.name,
      currency: portfolio.currency,
      targetBudget,
      totalExpenses,
      totalReversals,
      netSpending,
      remainingBudget,
      utilizationPercentage,
      milestoneStats: {
        total: totalMilestones,
        completed,
        pending,
        missed,
        overdue,
        completionRate
      }
    };
  }
}

